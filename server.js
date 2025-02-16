
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use(cors());

let openAiResponse = null;
let globalDescriptions = null;

app.post('/getAi', async (req, res) => {
    let globalData = req.body.data
    let globalDataCompanies = globalData.map(item => item.Company)
    let globalDataCompaniesString = globalDataCompanies.join(', ')
    let prompt = `Generate a concise, straight-forward company description for the following companies: ${globalDataCompaniesString}. Each description should be simple, neutral, formal and no longer than 15 words. The purpose of the sentence is to help people comprehend the exact market problem that each company solves, and what their exact solution is. Only do the first 3 companies.`

    if (!openAiResponse) {
        console.log('Sending request to OpenAI...')
        openAiResponse = await axios.post(
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

        const aiResponse = openAiResponse.data
        const aiResponseString = aiResponse.choices[0].message.content;
        const aiResponseArray = aiResponseString
            .split('\n')
            .filter(Boolean)
            .map(line => line.split(':')[1]);
        globalDescriptions = globalData.map((company, index) => ({...company, Description: aiResponseArray[index] }));
    }
    res.json(globalDescriptions)
})

// Serve static files (e.g., your frontend code)
app.use(express.static('public'));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));