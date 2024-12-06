Product Recommendations Using Generative AI and BigQuery
Introduction
Have you ever noticed how e-commerce platforms seem to know exactly what you want? Whether it's tech gadgets, fashion items, or even groceries, personalized recommendations make shopping seamless. This blog will walk you through building a recommendation system using Google Cloud's Generative AI (Gemini) and BigQuery, combined with a web application frontend.
We'll:
Use Generative AI (Gemini) to generate recommendations based on user queries.
Store recommendations in BigQuery for persistence and analysis.
Fetch and display these recommendations on a web application.

This guide is perfect for developers with basic knowledge of cloud tools, APIs, and web development. By the end, you'll understand the complete workflow, from processing user input to displaying results on a frontend.
Design
The project follows a straightforward flow:
Frontend: Users submit a query on the web application (e.g., "Suggest top tech gadgets").
Backend:

Sends the query to Generative AI (Gemini), which processes the input and returns recommendations.
Stores the recommendations in BigQuery along with the user's ID and a timestamp.

3. BigQuery: Acts as the central data repository, enabling query and retrieval operations.
4.  Frontend: Fetches the stored recommendations and displays them on reload.
Prerequisites
To get started, ensure you have the following:
Google Cloud Services:

BigQuery
Generative AI API (Gemini)
Cloud SDK

2. Software:
Node.js and npm
React.js
A code editor (e.g., VS Code)

3. Knowledge:
Familiarity with APIs
Basics of cloud computing and web development

Step-by-Step Instructions
Step 1: Setting Up BigQuery
Open the BigQuery Console in your Google Cloud account.
Create a dataset named your database name.
Create a table named userdata with the following schema:

user_id (STRING): Stores the user's ID.
recommendations (STRING): Stores the recommendation text.
created_at (TIMESTAMP): Logs the insertion timestamp.

Step 2: Building the Backend
Install Dependencies
Create a Node.js project and install the required libraries:
mkdir backend && cd backend
npm init -y
npm install express @google-cloud/bigquery google-generative-ai dotenv cors
Backend Code:-
Create a file named server.js and add the following code:

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const firestore = require("./firestoreConfig");
const { fetchBrowsingHistory } = require("./bigQueryConfig");
const axios = require("axios");
const vertexai=require("@google-cloud/vertexai");
const {GoogleGenerativeAI} = require("@google/generative-ai")
const { BigQuery } = require("@google-cloud/bigquery");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const bigquery = new BigQuery();

// Save user preferences
app.post("/api/preferences", async (req, res) => {
  const { userId, preferences } = req.body;
  try {
    await firestore.collection("users").doc(userId).set({ preferences });
    res.status(200).send({ message: "Preferences saved!" });
  } catch (err) {
    res.status(500).send({ error: "Failed to save preferences." });
  }
});

// Get product recommendations
app.post("/api/recommendations", async (req, res) => {
  const {userId}  = req.body;
  const message=req.body.body;
  
  console.log("message",message);
  console.log("user:",req.body)
  console.log('hello ')
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const prompt=`Suggest products based on message and give me the output with out any special charaters just give it in a text: ${message}`
    const result =await model.generateContent(prompt)
    const response = result.response
    const output=await response.text()
    console.log(output)
    
    res.status(200).send({ recommendations: output });
   const query=
    `INSERT INTO your_project_id.shopgenie.userdata (recommendations, user_id , timestamp)
    VALUES (@output ,@userId,CURRENT_TIMESTAMP())
        `;
      
        const options = {
          query: query,
          params: { userId: userId , output: output},
        };
        const [rows] = await bigquery.query(options);
        console.log("rows",rows)

        const query1 = `
        SELECT recommendations
        FROM \`your_project_id.shopgenie.userdata\`
        WHERE userid = userId
        ORDER BY timestamp DESC
        LIMIT 5;
      `;
    
      const options1 = {
        query: query1,
        params: { userId: userId },
      };
        const [rows1] = await bigquery.query(options1);
            
    
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to fetch recommendations." });
    console.log(err);
  }

});

app.get("/api/data", async (req, res) => {
  try {
    const query = `
      SELECT recommendations, user_id
      FROM \`your_project_id.shopgenie.userdata\`
      order by timestamp DESC
      LIMIT 5 ;
    `;
    const [rows] = await bigquery.query({ query });

    if (!rows.length) {
      return res.status(404).send({ message: "No data found." });
    }

    res.status(200).json(rows); 
  } catch (err) {
    console.error("Error fetching data from BigQuery:", err);
    res.status(500).send({ error: "Failed to fetch data." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

Step 3: Building the Frontend
Set Up React Application
npx create-react-app frontend
cd frontend
npm install axios
Frontend Code
Update src/App.js with this code:
import React from "react";
import Chatbot from "./chatbot.js"
import DisplayData from "./displaydata.jsx";

function App() {
  return (
    <div className="App">
      <Chatbot />
      <DisplayData/>
    </div>
  );
}

export default App;
Create Chatbot.js and write this code
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
      <div>
        <p><strong>Last 5 search </strong></p>
      </div>
    </div>
  );
};

export default Chatbot;
Create displaydata.jsx file and write this code
import React, { useEffect, useState } from "react";
import axios from "axios";

const DisplayData = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/data");
        setData(response.data); // Save the fetched data in state
      } catch (err) {
        console.log(error);
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      }
    };

    fetchData();
  }); // Empty dependency array ensures this runs only once on page load

  return (
    <div>
      <h1>Last 5 search</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data.length > 0 ? (
        <table border="1">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{row.user_id}</td>
                <td>{row.recommendations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default DisplayData;
Step 4: Running the Project
Start the backend:
node server.js

Start the frontend:
npm run start
Result / Demo
Upon visiting the frontend:
Enter your quey (e.g., "Suggest top fitness gadgets").
View personalized recommendations in an alert.
See previously generated recommendations listed on the webpage.
![image](https://github.com/user-attachments/assets/438ed273-a897-4ba1-91f3-51981e0d288b)

Output.What's Next?
1. Enhance Functionality:
Fine-tune the Gemini AI model for better recommendations.
Add user authentication to personalize results further.
2.  Data Visualization:
Use Looker Studio to analyze recommendation trends.
3. Scalability:
Integrate with Cloud Run or Kubernetes for scaling.
4. Real-Time Insights:
Incorporate streaming with Pub/Sub.
This project is a solid starting point to explore AI-powered recommendation systems. Feel free to extend and adapt it to meet your needs! 🚀
