import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CandidateProfile.css";

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "",
    address: "",
    email: "",
    password: "",
    phoneNumber: "",
    aboutMe: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [cv, setCv] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/profile/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleCvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCv(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/profile/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify(profileData),
      });
      if (response.ok) {
        alert("Profil mis à jour avec succès !");
      } else {
        alert("Erreur lors de la mise à jour.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-content">
        <div className="avatar-section">
          <div
            className="avatar-circle"
            onClick={() => document.getElementById("profile-image-input").click()}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="profile-image" />
            ) : (
              <div className="avatar-placeholder">📷</div>
            )}
          </div>
          <input
            type="file"
            id="profile-image-input"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </div>
        <div className="cv-section">
          <h3>Curriculum Vitae</h3>
          <input
            type="file"
            id="cv-upload"
            className="file-input"
            accept=".pdf,.doc,.docx"
            onChange={handleCvUpload}
          />
          <label htmlFor="cv-upload" className="cv-upload-button">
            {cv ? "Update CV" : "Upload CV"}
          </label>
          {cv && <p className="cv-name">{cv.name}</p>}
        </div>
      </div>
      <form onSubmit={handleUpdate} className="form">
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) =>
              setProfileData({ ...profileData, fullName: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="text"
            value={profileData.phoneNumber}
            onChange={(e) =>
              setProfileData({ ...profileData, phoneNumber: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            value={profileData.address}
            onChange={(e) =>
              setProfileData({ ...profileData, address: e.target.value })
            }
          />
        </div>
        <button type="submit" className="update-button">
          Update Information
        </button>
      </form>
    </div>
  );
};

export default CandidateProfile;
