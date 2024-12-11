from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(TIMESTAMP)


class Candidate(Base):
    __tablename__ = "candidates"
    __table_args__ = {'schema': 'PUBLIC'}

    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), ForeignKey("users.id"))
    name = Column(String(255))
    skills = Column(String(16777216))
    experience = Column(String(255))
    resume_url = Column(String(255))


class Recruiter(Base):
    __tablename__ = "recruiters"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    company_name = Column(String)
    industry = Column(String)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    recruiter_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    location = Column(String)
    requirements = Column(Text)
    created_at = Column(TIMESTAMP)

class Application(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    job_id = Column(String, ForeignKey("jobs.id"))
    status = Column(String, default="pending")
    applied_at = Column(TIMESTAMP)
