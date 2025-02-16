
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.post('/generate', async (req, res) => {

    const request = req.body.globalCompanies;
    const globalUnicornList = request.join(', ');
    const prompt = `Generate a concise, straight-forward company description for the following companies: ${globalUnicornList}. Each description should be simple, neutral, formal and no longer than 15 words. The purpose of the sentence is to help people comprehend the exact market problem that each company solves, and what their exact solution is. Only do the first 3 companies.`

    console.log('Sending request to OpenAI...')

    const openaiResponse = await axios.post(
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
    );

    console.log('Finished fetch...')
    res.json(openaiResponse.data);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));