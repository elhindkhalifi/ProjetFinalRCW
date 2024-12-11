import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "candidate", // Default to candidate
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Inscription réussie! Connectez-vous maintenant.");
        navigate("/");
      } else {
        alert(data.detail || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="page-container">
      <div className="register-container">
        <h1>Créer un compte</h1>

        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmer le mot de passe"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field"
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="candidate">Candidat</option>
            <option value="recruiter">Recruteur</option>
          </select>

          <button type="submit" className="submit-button">
            Créer mon compte
          </button>
        </form>

        <div className="return-section">
          <button
            type="button"
            className="return-button"
            onClick={() => navigate("/")}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/Register.css";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: "candidate", // Default to candidate
//   });
//   const [resume, setResume] = useState(null);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleResumeChange = (e) => {
//     setResume(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       alert("Les mots de passe ne correspondent pas");
//       return;
//     }

//     const formDataToSend = new FormData();
//     formDataToSend.append("email", formData.email);
//     formDataToSend.append("password", formData.password);
//     formDataToSend.append("role", formData.role);
//     if (formData.role === "candidate" && resume) {
//       formDataToSend.append("resume", resume);
//     }

//     try {
//       const response = await fetch("http://localhost:5000/register/", {
//         method: "POST",
//         body: formDataToSend,
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert("Inscription réussie! Connectez-vous maintenant.");
//         navigate("/");
//       } else {
//         alert(data.detail || "Erreur lors de l'inscription");
//       }
//     } catch (error) {
//       console.error("Erreur lors de l'inscription:", error);
//       alert("Erreur lors de l'inscription");
//     }
//   };

//   return (
//     <div className="page-container">
//       <div className="register-container">
//         <h1>Créer un compte</h1>

//         <form onSubmit={handleSubmit} className="register-form">
//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleChange}
//             className="input-field"
//             required
//           />
//           <input
//             type="password"
//             name="password"
//             placeholder="Mot de passe"
//             value={formData.password}
//             onChange={handleChange}
//             className="input-field"
//             required
//           />
//           <input
//             type="password"
//             name="confirmPassword"
//             placeholder="Confirmer le mot de passe"
//             value={formData.confirmPassword}
//             onChange={handleChange}
//             className="input-field"
//             required
//           />
//           <select
//             name="role"
//             value={formData.role}
//             onChange={handleChange}
//             className="input-field"
//             required
//           >
//             <option value="candidate">Candidat</option>
//             <option value="recruiter">Recruteur</option>
//           </select>
//           {formData.role === "candidate" && (
//             <div>
//               <label>Upload Resume:</label>
//               <input
//                 type="file"
//                 accept=".pdf,.doc,.docx"
//                 onChange={handleResumeChange}
//               />
//             </div>
//           )}
//           <button type="submit" className="submit-button">
//             Créer mon compte
//           </button>
//         </form>

//         <div className="return-section">
//           <button
//             type="button"
//             className="return-button"
//             onClick={() => navigate("/")}
//           >
//             Retour à la connexion
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;
