import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // For loading indicator

  // Load messages from localStorage when the component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever the messages state changes
  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (messageToSend) => {
    if (messageToSend.trim() === '') return;

    // Add the user's message locally
    const userMessage = { text: messageToSend, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage('');
    setLoading(true);

    const userId = localStorage.getItem('userId'); // Fetch the user ID
    const role = localStorage.getItem('role'); // Fetch the user's role (candidate or recruiter)

    if (!userId || !role) {
      console.error('User ID or role not available');
      const errorMessage = { text: 'You are not logged in. Please log in and try again.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend, user_id: userId, role }),
      });

      if (response.ok) {
        const botMessage = await response.json();
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        console.error('Error sending message:', response.statusText);
        const errorMessage = { text: 'A problem occurred, please try again later.', sender: 'bot' };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { text: 'A problem occurred, please try again later.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      <div className="container-fluid flex-grow-1 overflow-auto">
        <div className="row">
          <div className="col">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex mb-2 justify-content-${msg.sender === 'user' ? 'end' : 'start'}`}
              >
                <div
                  className={`p-2 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}
                  style={{ maxWidth: '70%' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="d-flex justify-content-start">
                <div className="p-2 rounded bg-light" style={{ maxWidth: '70%' }}>
                  <i>Loading...</i>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="container-fluid py-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(message)}
          />
          <button className="btn btn-primary" onClick={() => handleSendMessage(message)} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
