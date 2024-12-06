const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const firestore = require("./firestoreConfig");
const { fetchBrowsingHistory } = require("./bigQueryConfig");
const axios = require("axios");
const vertexai=require("@google-cloud/vertexai");
// const markdown = require("react-markdown");
// import GoogleGenerativeAI  from "@google/generative-ai"
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
    // const browsingHistory = await fetchBrowsingHistory(userId);
    // console.log(browsingHistory)

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    // const data = await browsingHistory
    const prompt=`Suggest products based on message and give me the output with out any special charaters just give it in a text: ${message}`
    const result =await model.generateContent(prompt)
    const response = result.response
    const output=await response.text()
    // const final =<markdown>output</markdown>
    console.log(output)
    // const output = await response.text()
    
    res.status(200).send({ recommendations: output });
   const query=
    `INSERT INTO exalted-entity-341315.shopgenie.userdata (recommendations, user_id)
    VALUES (@output ,@userId)
        `;
      
        const options = {
          query: query,
          params: { userId: userId , output: output},
        };
        const [rows] = await bigquery.query(options);
        console.log("rows",rows)
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to fetch recommendations." });
    console.log(err);
  }

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// /Import `GoogleGenerative` from the package we installed earlier.
// import { GoogleGenerativeAI } from "@google/generative-ai"
// import { NextResponse } from "next/server"

// Create an asynchronous function POST to handle POST
// request with parameters request and response.
// export async function POST(req, res) {
//   try {
//     // Access your API key by creating an instance of GoogleGenerativeAI we'll call it GenAI
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

