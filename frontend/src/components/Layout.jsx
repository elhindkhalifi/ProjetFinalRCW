import React from "react";
import ScrollToBottom from "./ScrollToBottom";

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      {children} {/* Contenu principal de la page */}
      <ScrollToBottom /> {/* Bouton de défilement */}
    </div>
  );
};

export default Layout;
