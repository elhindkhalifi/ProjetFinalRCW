from fastapi import FastAPI, Depends, HTTPException, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db.database import get_db, engine
from db.models import Base, User, Candidate, Recruiter, Job
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from io import BytesIO
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain, LLMChain
from langchain.prompts.chat import ChatPromptTemplate
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid
import os
import shutil
import openai
import json
import re


# Initialize FastAPI app
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Directory for temporary storage of uploaded resumes
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class Message(BaseModel):
    message: str
    user_id: str 
    role: str  # "candidate" or "recruiter"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ProfileUpdateRequest(BaseModel):
    fullName: str
    address: str
    phoneNumber: str
    
class JobRequest(BaseModel):
    title: str
    description: str
    location: str
    requirements: str

# All your functions and routes remain unchanged below

# Function to extract text from PDFs
def get_pdf_text(pdf_docs):
    text = ""
    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

# Function to split text into chunks
def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

# Function to create a vector store
def get_vectorstore(text_chunks):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def conversation_chains(vectorstore):
    current_llm = ChatOpenAI(openai_api_key=openai.api_key)
    current_memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=current_llm,
        retriever=vectorstore.as_retriever(),
        memory=current_memory
    )
    return conversation_chain



from fastapi import Depends, HTTPException

@app.post('/send')
async def send(message_data: Message, db: Session = Depends(get_db)):
    message = message_data.message
    user_id = message_data.user_id
    role = message_data.role.lower()  # Determine the user's role

    if not message or not user_id or not role:
        raise HTTPException(status_code=400, detail="Message, User ID, and Role are required")

    # Fetch user-specific data
    if role == "candidate":
        current_user_cv = db.query(Candidate).filter(Candidate.user_id == user_id).first()
        if not current_user_cv:
            raise HTTPException(status_code=404, detail="Candidate's CV not found")

        # Create a combined context using the candidate's CV
        combined_text = f"Candidate CV: Name: {current_user_cv.name}, Skills: {current_user_cv.skills}, Experience: {current_user_cv.experience}\n"

        # Add the chatbot's functionality to suggest CV improvements
        response = generate_cv_improvement_suggestions(message, combined_text)

    elif role == "recruiter":
        jobs = db.query(Job).all()
        candidates = db.query(Candidate).all()

        # Create a combined context using all candidates and jobs
        combined_text = "Available Candidates and Jobs:\n"
        for candidate in candidates:
            combined_text += f"Candidate Name: {candidate.name}, Skills: {candidate.skills}, Experience: {candidate.experience}\n"
        for job in jobs:
            combined_text += f"Job Title: {job.title}, Requirements: {job.requirements}, Description: {job.description}\n"

        # Add the chatbot's functionality to filter candidates
        response = suggest_candidate_filtering(message, combined_text)
    else:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    # Return the chatbot's response
    return {"text": response, "sender": "bot"}


def generate_cv_improvement_suggestions(message, combined_text):
    """Function to suggest CV improvements."""
    prompt = f"""
    You are a helpful AI designed to improve CVs. The user has provided the following CV and a question:

    {combined_text}

    Question: {message}

    Provide specific and actionable improvements to the CV to make it more appealing to recruiters.
    """
    # Use a language model to generate a response
    llm = ChatOpenAI(model="gpt-4", max_tokens=500, temperature=0.7)
    chain = LLMChain(prompt=ChatPromptTemplate.from_template(prompt), llm=llm)
    return chain.run({})


def suggest_candidate_filtering(message, combined_text):
    """Function to suggest candidate filtering strategies."""
    prompt = f"""
    You are a recruitment assistant AI. The recruiter has provided the following data and a question:

    {combined_text}

    Question: {message}

    Provide actionable recommendations for filtering candidates based on their skills and experience, aligning them with job requirements.
    """
    # Use a language model to generate a response
    llm = ChatOpenAI(model="gpt-4", max_tokens=500, temperature=0.7)
    chain = LLMChain(prompt=ChatPromptTemplate.from_template(prompt), llm=llm)
    return chain.run({})

def extract_info_with_ai(text):
    # Define the template for information extraction
    template = """
    You are a skilled AI designed to extract information from resumes or CVs. 
    Extract the following details from the CV text provided:
    - Name of the candidate
    - Skills (both technical and non-technical)
    - Experience (in years )
    
    CV Text:
    {cv_text}
    
    Provide the information in the following format:
    - Name: [Extracted Name]
    - Skills: [Extracted Skills]
    - Experience: [Extracted Experience]
    """
    # Create a prompt template
    prompt = ChatPromptTemplate.from_template(template)
    # Initialize the LLM
    llm = ChatOpenAI(model="gpt-4o", max_tokens=500, temperature=0.5)
    # Define the chain
    chain = LLMChain(prompt=prompt, llm=llm)
    # Extract information
    try:
        response = chain.run({"cv_text": text})
        lines = response.strip().split("\n")
        extracted_name = lines[0].split(":")[1].strip()
        extracted_skills = lines[1].split(":")[1].strip()
        extracted_experience = lines[2].split(":")[1].strip()
        return extracted_name, extracted_skills, extracted_experience
    except Exception as e:
        raise Exception(f"Error extracting information with AI: {e}")

@app.post("/upload-cv/")
async def upload_cv(file: UploadFile = File(...), user_id: str = Form(...), token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{file.filename}")
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        with open(file_path, "rb") as pdf_file:
            pdf_text = get_pdf_text([pdf_file])
            if not pdf_text:
                raise HTTPException(status_code=400, detail="Failed to extract text from the PDF")
            text_chunks = get_text_chunks(pdf_text)
            vectorstore = get_vectorstore(text_chunks)
            name, skills, experience = extract_info_with_ai(pdf_text)
            print("Extracted infos :" + name + skills + experience)
            
            resume_url = f"/uploads/{user_id}_{file.filename}"
            print("Extracted infos :" + name + skills + experience + resume_url)
            print(user_id)
            db.query(Candidate).filter(Candidate.user_id == user_id).delete()

            new_candidate = Candidate(
                id=str(uuid.uuid4()),
                user_id = user_id,
                name = name,
                skills = skills,
                experience = experience,
                resume_url = resume_url,
            )
            db.add(new_candidate)
            
            db.commit()
            

            db.refresh(new_candidate)
            return JSONResponse(content={
                "message": "CV uploaded and candidate record created successfully!",
                "candidate_id": user_id,
                "name": name,
                "skills": skills,
                "experience": experience,
                "resume_url": resume_url,
            }, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload and process CV: {e}")

@app.get("/jobs/")
def get_jobs(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        # Decode the token to get user info (optional, depending on your requirements)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        # Fetch jobs from the database
        jobs = db.query(Job).all()

        return jobs  # Return the list of jobs

    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")




@app.post("/match-jobs/")
async def match_jobs(
    user_id: str = Form(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # Decode the token and fetch user
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user_id = payload.get("sub")
        if current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Fetch candidate info from DB
        candidate = db.query(Candidate).filter(Candidate.user_id == user_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Fetch all jobs
        jobs = db.query(Job).all()
        if not jobs:
            return {"message": "No jobs available to match"}

        # Perform AI-based matching
        matched_jobs = ai_match_jobs(candidate, jobs)  # We'll define this function below.

        return {"matched_jobs": matched_jobs}

    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")



def ai_match_jobs(candidate, jobs):
    # Build a list of jobs as a formatted string for the prompt
    job_list = "\n".join([
        f"Job ID: {job.id}, Title: {job.title}, Requirements: {job.requirements}, Description: {job.description}"
        for job in jobs
    ])

    prompt_template = f"""
    You are an AI job matcher. Given a candidate's name, skills, and experience, and a list of jobs
    with their requirements and descriptions, return the top 10 job matches based on the following criteria:

    1. Provide the job ID, title, matching skills, and missing skills for each job.
    2. Sort the jobs in descending order.
    3. Only include the top 10 jobs.
    4. Return the result as a JSON array with objects containing:
        - id: Job ID
        - title: Job Title
        - matching_skills: List of skills that match
        - missing_skills: List of skills that are missing.

    Candidate Name: {candidate.name}
    Candidate Skills: {candidate.skills}
    Candidate Experience: {candidate.experience}

    Jobs:
    {job_list}

    Return only the JSON array of objects as described.
    """

    # Set temperature=0 for deterministic responses and better adherence to instructions
    llm = ChatOpenAI(model="gpt-4", max_tokens=1500, temperature=0)
    chain = LLMChain(
        prompt=ChatPromptTemplate.from_template(prompt_template),
        llm=llm
    )

    # Run the chain to get the response
    response = chain.run({})
    print("Raw LLM response:", response)  # For debugging, print the model output

    # Attempt to parse the response as JSON
    try:
        job_matches = json.loads(response.strip())
        # Validate the response is a list of objects
        if isinstance(job_matches, list) and all("id" in job for job in job_matches):
            return job_matches
        else:
            print("Invalid AI response format, falling back to default")
            return []
    except json.JSONDecodeError:
        print("Error parsing AI response, falling back to default")
        return []






def generate_motivation_letter_template(candidate, job, job_type=None):
    # Detailed template for motivation letter generation
    prompt_template = f"""
    You are an AI assistant designed to help candidates write personalized motivation letters for job applications. The following information is provided to create the letter:

    Candidate Information:
    - Name: {candidate.name}
    - Skills: {candidate.skills}
    - Experience: {candidate.experience} years

    Job Information:
    - Job Title: {job.title}
    - Job Description: {job.description}
    - Job Requirements: {job.requirements}
    
    Instructions:
    1. Write a formal and persuasive motivation letter for the candidate applying for the job.
    2. Address the letter to the recruiter with a professional tone.
    3. The letter should explain why the candidate is a great fit for the job based on their skills and experience.
    4. Emphasize the alignment between the candidate’s background and the job requirements.
    5. Be specific and provide examples that demonstrate the candidate’s qualifications.
    6. Keep the letter concise but impactful, aiming for approximately 300-400 words.

    Use this structure:
    - Greeting: Address the recruiter
    - Introduction: Briefly introduce the candidate and the position they are applying for
    - Body: Explain the candidate’s relevant experience and skills, matching them with the job requirements
    - Conclusion: Express enthusiasm for the opportunity and a call to action

    End with a professional closing statement.
    """

    # If there's a specific job type (e.g., remote, tech), we could adjust the tone
    if job_type:
        prompt_template += f"\nNote: The job is a {job_type} position. Adjust the tone accordingly."

    return prompt_template

def generate_motivation_letter(candidate, job, job_type=None):
    try:
        prompt = generate_motivation_letter_template(candidate, job, job_type)
        
        # Initialize the OpenAI model and chain
        llm = ChatOpenAI(model="gpt-4", max_tokens=1000, temperature=0.5)
        chain = LLMChain(prompt=ChatPromptTemplate.from_template(prompt), llm=llm)

        # Generate the motivation letter
        letter = chain.run({})

        

        return letter

    except Exception as e:
        print(f"Error generating motivation letter: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating the motivation letter")



@app.post("/generate-motivation-letter/")
async def generate_motivation_letter_endpoint(
    user_id: str = Form(...),
    job_id: str = Form(...),
    job_type: str = Form(None),  # Optional job type for customization
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # Decode the token and fetch user
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user_id = payload.get("sub")
        if current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Fetch candidate info
        candidate = db.query(Candidate).filter(Candidate.user_id == user_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Fetch job info
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Generate the motivation letter
        motivation_letter = generate_motivation_letter(candidate, job, job_type)

        return JSONResponse(content={
            "message": "Motivation letter generated successfully",
            "motivation_letter": motivation_letter
        }, status_code=200)

    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")



class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Secret key to encode and decode JWT tokens (store this securely in a real app)
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expiration time (e.g., 30 minutes)

# Initialize password context (same as before)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to create JWT token
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Login Endpoint
@app.post("/login/")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create a JWT token
    access_token = create_access_token(data={"sub": user.id})
    print(user.id + user.email + user.role)
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "access_token": access_token  # Send token back to frontend
    }

    
@app.post("/register/")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(request.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        password=hashed_password,
        role=request.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "role": new_user.role}

# cote recruteur

@app.get("/candidates/")
def get_candidates(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # Decode the token and verify the recruiter role
    try:
        # Here we decode the JWT token and check for the recruiter role
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()

        if user is None or user.role != "recruiter":
            raise HTTPException(status_code=403, detail="Not authorized to access candidates")
        
        # Fetch all candidates from the database
        candidates = db.query(Candidate).all()

        # Return candidate details
        return candidates
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")


@app.post("/add-job/")
async def add_job(
    job: JobRequest,  # Directly use the Pydantic model to parse the job fields from JSON body
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # Decode the token to get user info
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        # Fetch the user from the database
        user = db.query(User).filter(User.id == user_id).first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        # Create a new job entry in the database
        new_job = Job(
            id=str(uuid.uuid4()),  # Generate a unique ID for the job
            recruiter_id=user_id,  # Set the recruiter_id from the logged-in user
            title=job.title,
            description=job.description,
            location=job.location,
            requirements=job.requirements,
            created_at=datetime.utcnow()  # Set the current timestamp for the job creation
        )

        # Add the job to the database
        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        return JSONResponse(content={
            "message": "Job offer added successfully!",
            "job_id": new_job.id,
            "title": new_job.title,
            "description": new_job.description,
            "location": new_job.location,
            "requirements": new_job.requirements,
        }, status_code=200)

    except jwt.JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")



def ai_match_candidates(candidates, job):
    # Build a list of candidates and job details as formatted strings
    candidate_list = "\n".join([
        f"Candidate ID: {candidate.id}, Name: {candidate.name}, Skills: {candidate.skills}, Experience: {candidate.experience} years"
        for candidate in candidates
    ])

    prompt_template = f"""
    You are an AI job matcher. You have a list of candidates and a job description. Your task is to match candidates
    to the job by comparing their skills and experience with the job requirements.

    Job Title: {job.title}
    Job Description: {job.description}
    Job Requirements: {job.requirements}

    Candidates:
    {candidate_list}

    Please return the top 3 candidates' IDs in the following format:
    ["candidate_id_1", "candidate_id_2", "candidate_id_3"]

    Ensure the output is in **exact JSON array format**, and only include candidate IDs, no extra text or explanations.
    """

    # Use OpenAI to process the request
    llm = ChatOpenAI(model="gpt-4", max_tokens=500, temperature=0)
    chain = LLMChain(
        prompt=ChatPromptTemplate.from_template(prompt_template),
        llm=llm
    )

    # Run the chain to get the response
    response = chain.run({})

    # Log the raw response for debugging
    print("Raw LLM response:", response)  # Check what the AI is returning

    # Clean the response to extract only the JSON array of candidate IDs
    try:
        # Use a regex to extract the JSON array from the response
        match = re.search(r'\[.*\]', response.strip())  # Match the JSON array
        if match:
            candidate_ids = json.loads(match.group(0))  # Parse the matched JSON array
        else:
            raise ValueError("JSON array not found in the response")

        # Ensure no repeated candidate IDs and the list is of length 3
        candidate_ids = list(dict.fromkeys(candidate_ids))  # Remove duplicates

        if len(candidate_ids) < 3:
            candidate_ids.extend(["Fallback Candidate ID"] * (3 - len(candidate_ids)))  # Fill with fallback IDs if needed

        # Return the matched candidates from the database based on the IDs
        matched_candidates = [
            {"id": candidate.id, "name": candidate.name, "skills": candidate.skills, "experience": candidate.experience}
            for candidate in candidates if candidate.id in candidate_ids
        ]
        return matched_candidates

    except (json.JSONDecodeError, ValueError) as e:
        # Log the error if response parsing fails
        print("Error parsing AI response, returning fallback candidates.")
        print(f"Raw response that caused the error: {response}")  # Log the raw response here
        return [{"id": candidate.id, "name": candidate.name, "skills": candidate.skills, "experience": candidate.experience}
                for candidate in candidates[:3]]






@app.get("/match-candidates/{job_id}")
async def match_candidates(job_id: str, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # Decode the token to get user info
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user_id = payload.get("sub")

        # Fetch the job details
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Fetch all candidates from the database
        candidates = db.query(Candidate).all()

        # Perform AI-based matching
        matched_candidates = ai_match_candidates(candidates, job)

        return matched_candidates  # Return matched candidates

    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token or token expired")




@app.get("/")
def root():
    return {"message": "Backend connected successfully"}
