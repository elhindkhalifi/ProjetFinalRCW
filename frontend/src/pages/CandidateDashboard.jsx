import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaStar, FaSearch } from "react-icons/fa";
import "../styles/CandidateDashboard.css";
import Chat from "./Chat"
// Composant Navbar
const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchQuery("");
    }
  };

  return (
    <nav className="custom-navbar">
      <button
        className="navbar-item"
        onClick={() => navigate("/candidate-dashboard")}
        aria-label="Home"
      >
        <FaHome />
        <span>Home</span>
      </button>
      <button
        className="navbar-item"
        onClick={() => navigate("/profile")}
        aria-label="Profile"
      >
        <FaUser />
        <span>Profile</span>
      </button>
      <button
        className={`navbar-item search-item ${searchOpen ? "active" : ""}`}
        onClick={() => setSearchOpen(!searchOpen)}
        aria-label="Search"
      >
        <FaSearch />
        <span>Search</span>
      </button>
      {searchOpen && (
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
          />
          <button onClick={handleSearch}>Go</button>
        </div>
      )}
      <button
        className="navbar-item active"
        onClick={() => navigate("/")}
        aria-label="Logout"
      >
        <FaStar />
        <span>Logout</span>
      </button>
    </nav>
  );
};




const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [cv, setCv] = useState(null);
  const [offres, setOffres] = useState([]);
  const [error, setError] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [extractedInfo, setExtractedInfo] = useState({
    name: "",
    skills: "",
    experience: ""
  });
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [motivationLetters, setMotivationLetters] = useState({});

  const userId = localStorage.getItem("userId");
  const userToken = localStorage.getItem("userToken");

  // Fetch job offers from the API
  const fetchOffres = async () => {
    try {
      const response = await fetch("http://localhost:5000/jobs/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job offers");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setOffres(data);
      } else {
        throw new Error("Unexpected data format received for job offers");
      }
    } catch (err) {
      console.error("Error fetching job offers:", err);
      setError("Erreur lors de la récupération des offres.");
    }
  };

  useEffect(() => {
    fetchOffres();
  }, []);

  // Handle CV upload
  const handleCvUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      alert("No file selected");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    if (!userId || !userToken) {
      alert("User not logged in. Please log in first.");
      return;
    }

    setCv(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    try {
      const response = await fetch("http://localhost:5000/upload-cv/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Upload failed");
      }

      setUploadStatus("CV uploaded successfully!");

      setExtractedInfo({
        name: result.name,
        skills: result.skills,
        experience: result.experience,
      });
    } catch (error) {
      console.error("Error uploading CV:", error);
      setUploadStatus("Failed to upload CV. Please try again.");
    }
  };

  // Handle job matching
  const handleMatchJobs = async () => {
    if (!userId || !userToken) {
      alert("User not logged in. Please log in first.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);

    try {
      const response = await fetch("http://localhost:5000/match-jobs/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.matched_jobs) {
        setMatchedJobs(data.matched_jobs);
      } else {
        alert("No matched jobs found or unable to match at this time.");
      }
    } catch (error) {
      console.error("Error matching jobs:", error);
      alert("Failed to match jobs. Please try again.");
    }
  };

  // Handle motivation letter generation
  const handleGenerateMotivationLetter = async (jobId) => {
    if (!userId || !userToken) {
      alert("User not logged in. Please log in first.");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("job_id", jobId);

    try {
      const response = await fetch("http://localhost:5000/generate-motivation-letter/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Set the generated letter for the specific job
        setMotivationLetters((prevLetters) => ({
          ...prevLetters,
          [jobId]: data.motivation_letter,
        }));
      } else {
        alert("Failed to generate motivation letter.");
      }
    } catch (error) {
      console.error("Error generating motivation letter:", error);
      alert("Failed to generate motivation letter. Please try again.");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-left"></div>
        <div className="nav-center">
          <h1>RECRUITMENT</h1>
        </div>
        <div className="nav-right">
          <button className="nav-icon" onClick={() => navigate("/profile")}>
            👤
          </button>
          <button className="nav-icon" onClick={handleLogout}>
            🚪
          </button>
        </div>
      </nav>

      <div className="dashboard-hero">
        <div className="hero-content">
          <h2>ESPACE CANDIDAT</h2>
          <p>Découvrez les offres qui correspondent à votre profil</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="cv-section">
          <h3>MON CV</h3>
          <div className="cv-upload">
            <input
              type="file"
              accept=".pdf"
              onChange={handleCvUpload}
              id="cv-upload"
              className="file-input"
            />
            <label htmlFor="cv-upload" className="upload-button">
              {cv ? "MODIFIER MON CV" : "TÉLÉCHARGER MON CV"}
            </label>
            {cv && <p className="cv-name">CV actuel : {cv.name}</p>}
            {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
          </div>

          {extractedInfo.name && (
            <div className="extracted-info">
              <h4>Informations Extraites</h4>
              <p><strong>Nom:</strong> {extractedInfo.name}</p>
              <p><strong>Compétences:</strong> {extractedInfo.skills}</p>
              <p><strong>Expérience:</strong> {extractedInfo.experience}</p>
              <button className="match-button" onClick={handleMatchJobs}>
                Trouver les Offres Correspondantes
              </button>
            </div>
          )}

          {matchedJobs.length > 0 && (
            <div className="matched-jobs-section">
              <h4>Offres qui correspondent à votre profil</h4>
              {matchedJobs.map((job) => (
                <div key={job.id} className="offre-card">
                  <h4>{job.title}</h4>
                  <p>{job.description}</p>
                  <p><strong>Compétences correspondantes:</strong> {job.matching_skills.join(", ")}</p>
                  <p><strong>Compétences manquantes:</strong> {job.missing_skills.join(", ")}</p>
                  <div className="offre-actions">
                    <button
                      className="action-button secondary"
                      onClick={() => handleGenerateMotivationLetter(job.id)}
                    >
                      Générer Lettre de Motivation
                    </button>
                  </div>
                  {motivationLetters[job.id] && (
                    <div className="motivation-letter">
                      <h5>Lettre de Motivation:</h5>
                      <p>{motivationLetters[job.id]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Chat />

      {showScrollButton && (
        <button className="scroll-button" onClick={scrollToTop}>
          ↑
        </button>
        
      )}
    </div>
    
  );
};

export default CandidateDashboard;
