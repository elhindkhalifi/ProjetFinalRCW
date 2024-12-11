import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simuler une soumission
    console.log("Email soumis pour la réinitialisation:", email);
    setIsSubmitted(true);
    setTimeout(() => {
      navigate("/");
    }, 3000); // Retour à la page de connexion après 3 secondes
  };

  return (
    <div className="reset-container">
      {!isSubmitted ? (
        <>
          <h1>Réinitialisation de mot de passe</h1>
          <p>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
            de mot de passe.
          </p>
          <form onSubmit={handleSubmit} className="form-group">
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" className="reset-button">
              Envoyer le lien
            </button>
          </form>
        </>
      ) : (
        <div className="confirmation-message">
          <h2>Email envoyé !</h2>
          <p>
            Si cette adresse est associée à un compte, un email avec des
            instructions a été envoyé.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
