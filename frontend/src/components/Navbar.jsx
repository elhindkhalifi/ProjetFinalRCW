import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaStar, FaSearch } from "react-icons/fa";
import "../styles/CandidateDashboard.css";

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

export default Navbar;
