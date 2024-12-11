import React, { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const newMessage = { user: "You", text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      const response = await fetch("http://localhost:8000/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "Bot", text: data.response },
      ]);
    } catch (error) {
      console.error("Error interacting with chatbot:", error);
    }

    setInput("");
  };

  return (
    <div className="chatbot">
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.user === "You" ? "user-message" : "bot-message"}
          >
            <strong>{msg.user}: </strong>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
