import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RecruiterProfil.css";

const RecruiterProfil = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    address: "",
    phoneNumber: "",
  });

  const [profileImage, setProfileImage] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/profile-recruiter/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error("Erreur lors du chargement du profil recruteur:", error);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/profile-recruiter/", {
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
      <h1 className="profile-title">Profil Recruteur</h1>
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
        <form onSubmit={handleUpdate} className="form">
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              value={profileData.fullName}
              disabled
              className="input-disabled"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="input-disabled"
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
              className="input-enabled"
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
              className="input-enabled"
            />
          </div>
          <button type="submit" className="update-button">
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecruiterProfil;
