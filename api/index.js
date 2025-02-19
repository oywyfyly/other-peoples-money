
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use(cors({}));

//.js
app.post('/api/index.js', async (req, res) => {
    let globalData = req.body.data
    let globalDataCompanies = globalData.map(item => item.Company)

    console.log(globalDataCompanies)

    let globalDataCompaniesString = globalDataCompanies.join(', ')
    let prompt = `I'm giving you a list of global private companies ranked by valuation. Generate a concise, straight-forward company description for each of these following companies: ${globalDataCompaniesString}. Each description should be simple, neutral, formal and no longer than 20 words. The purpose of the sentence is to help people comprehend the exact market problem that each company solves, and what their exact solution is.`

    console.log('Sending request to OpenAI...')
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: prompt }]
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    )
    console.log('Done! Sending back...')

    const aiResponse = await response.data
    const aiResponseString = aiResponse.choices[0].message.content;
    const aiResponseArray = aiResponseString
        .split('\n')
        .filter(Boolean)
        .map(line => line.split(':')[1]);
    let globalDataComplete = globalData.map((company, index) => ({...company, Description: aiResponseArray[index]}));
    
    res.json(globalDataComplete)
})

// // Serve static files (e.g., your frontend code)
app.use(express.static('public'));

// // // Export the Express app for Vercel
module.exports = app;