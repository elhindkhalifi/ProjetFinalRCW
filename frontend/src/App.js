import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import CandidateProfile from "./pages/CandidateProfile";
import RecruiterProfil from "./pages/RecruiterProfil";
import Chat from './pages/Chat'; 

import "./styles/App.css";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Page de connexion */}
        <Route path="/" element={<Login />} />

        {/* Dashboards */}
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />

        {/* Authentification */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />

        {/* Profils */}
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/profile-recruiter" element={<RecruiterProfil />} />

        <Route path="/chat" element={<Chat />} /> 

      </Routes>
    </Router>
  );
};

export default App;
