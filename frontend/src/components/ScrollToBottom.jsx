import React from "react";
import "../styles/ScrollToBottom.css";

const ScrollToBottom = () => {
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <button className="scroll-to-bottom" onClick={scrollToBottom}>
      ⬇ Scroll Down
    </button>
  );
};

export default ScrollToBottom;
