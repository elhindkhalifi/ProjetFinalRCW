import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("candidate");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user_id and userToken in localStorage after successful login
        localStorage.setItem("userId", data.id);  // Store the user ID
        localStorage.setItem("userToken", data.access_token);  // Store the access token

        // Navigate based on the user's role
        if (data.role === "recruiter") {
          navigate("/recruiter-dashboard");
        } else {
          navigate("/candidate-dashboard");
        }
      } else {
        alert(data.detail || "Identifiants invalides!");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Erreur lors de la connexion");
    }
  };

  const handleForgotPassword = () => {
    navigate("/reset-password");
  };

  return (
    <div className="page-container">
      <div className="login-container">
        <h1>Connexion</h1>

        <div className="user-type-buttons">
          <button
            className={`type-button ${
              userType === "candidate" ? "active" : ""
            }`}
            onClick={() => setUserType("candidate")}
          >
            Candidat
          </button>
          <button
            className={`type-button ${
              userType === "recruiter" ? "active" : ""
            }`}
            onClick={() => setUserType("recruiter")}
          >
            Recruteur
          </button>
        </div>

        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />

          <div className="forgot-password">
            <button
              onClick={handleForgotPassword}
              className="forgot-password-link"
              type="button"
            >
              Mot de passe oublié?
            </button>
          </div>

          <button onClick={handleLogin} className="login-button" type="button">
            Se connecter
          </button>

          {userType === "candidate" && (
            <div className="register-section">
              <p>Pas encore de compte ?</p>
              <button
                onClick={() => navigate("/register")}
                className="register-button"
                type="button"
              >
                Créer un compte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
