import React, { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleSend = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/recommendations", {
        userId: "user123",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
     
      setChatHistory([...chatHistory, { user: message, bot: response.data.recommendations }]);
      setMessage("");
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div>
      <h1>Retail Chatbot</h1>
      <div>
        {chatHistory.map((chat, index) => (
          <div key={index}>
            <p><strong>You:</strong> {chat.user}</p>
            <p><strong>Bot:</strong> {chat.bot}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask for recommendations..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default Chatbot;
