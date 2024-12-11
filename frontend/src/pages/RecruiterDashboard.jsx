import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RecruiterDashboard.css";
import { FaHome, FaUser, FaStar, FaSearch } from "react-icons/fa";

// Composant Navbar
const Navbar = ({ toggleSearch, isSearchOpen, handleLogout, navigate }) => (
  <nav className="custom-navbar">
    <button
      className="navbar-item"
      onClick={() => navigate("/recruiter-dashboard")}
      aria-label="Home"
    >
      <FaHome />
      <span>Home</span>
    </button>
    <button
      className="navbar-item"
      onClick={() => navigate("/profile-recruiter")}
      aria-label="Profile"
    >
      <FaUser />
      <span>Profile</span>
    </button>
    <button
      className={`navbar-item search-item ${isSearchOpen ? "active" : ""}`}
      onClick={toggleSearch}
      aria-label="Search"
    >
      <FaSearch />
      <span>Search</span>
    </button>
    <button
      className="navbar-item active"
      onClick={handleLogout}
      aria-label="Logout"
    >
      <FaStar />
      <span>Logout</span>
    </button>
  </nav>
);

// Composant de formulaire d'emploi
const JobForm = ({
  jobForm,
  handleJobFormChange,
  handleJobSubmit,
  message,
}) => (
  <form onSubmit={handleJobSubmit} className="job-form">
    <h3>Create a New Job Offer</h3>
    {["title", "location"].map((field) => (
      <div key={field}>
        <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
        <input
          type="text"
          name={field}
          value={jobForm[field]}
          onChange={handleJobFormChange}
          required
        />
      </div>
    ))}
    <div>
      <label>Description:</label>
      <textarea
        name="description"
        value={jobForm.description}
        onChange={handleJobFormChange}
        required
      />
    </div>
    <div>
      <label>Requirements:</label>
      <textarea
        name="requirements"
        value={jobForm.requirements}
        onChange={handleJobFormChange}
        required
      />
    </div>
    <button type="submit">Add Job</button>
    {message && <p>{message}</p>}
  </form>
);

/// Composant principal
const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    experience: "",
    skills: "",
    availability: "",
  });
  const [candidates, setCandidates] = useState([]);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    requirements: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/candidates/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        });
        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const fetchMatchedCandidates = async (jobId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/match-candidates/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      const data = await response.json();
      setMatchedCandidates(data);
    } catch (error) {
      console.error("Error fetching matched candidates:", error);
    }
  };

  const toggleSearch = () => setIsSearchOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("userToken");
    if (!token) {
      setMessage("You need to be logged in to add a job.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/add-job/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobForm),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Job added successfully!");
        setJobForm({
          title: "",
          description: "",
          location: "",
          requirements: "",
        });
        setIsAddingJob(false);
        fetchMatchedCandidates(data.job_id);
      } else {
        setMessage(data.detail || "Failed to add the job.");
      }
    } catch (error) {
      console.error("Error adding job:", error);
      setMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar
        toggleSearch={toggleSearch}
        isSearchOpen={isSearchOpen}
        handleLogout={handleLogout}
        navigate={navigate}
      />
      <div className="dashboard-content">
        <h2 className="content-title">Candidats Disponibles</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="candidates-list">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="candidate-card">
                <h3>{candidate.name}</h3>
                <p>
                  <strong>Expérience:</strong> {candidate.experience}
                </p>
                <p>
                  <strong>Compétences:</strong>{" "}
                  {Array.isArray(candidate.skills)
                    ? candidate.skills.join(", ")
                    : candidate.skills.split(",").join(", ")}
                </p>
                <button className="contact-button">Contact</button>
              </div>
            ))}
          </div>
        )}
        {matchedCandidates.length > 0 && (
          <div className="matched-candidates">
            <h3>Matched Candidates</h3>
            {matchedCandidates.map((candidate) => (
              <div key={candidate.id} className="candidate-card">
                <h3>{candidate.name}</h3>
                <p>
                  <strong>Experience:</strong> {candidate.experience}
                </p>
                <p>
                  <strong>Skills:</strong> {candidate.skills}
                </p>
               
              </div>
            ))}
          </div>
        )}
        <button
          className="add-job-button"
          onClick={() => setIsAddingJob((prev) => !prev)}
        >
          {isAddingJob ? "Cancel" : "Add Job Offer"}
        </button>
        {isAddingJob && (
          <JobForm
            jobForm={jobForm}
            handleJobFormChange={(e) =>
              setJobForm((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }))
            }
            handleJobSubmit={handleJobSubmit}
            message={message}
          />
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
