export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_KEY = process.env.GROQ_API_KEY;
    
    if (!API_KEY) {
      console.error('GROQ_API_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured on server' 
      });
    }

    // Validate request body
    if (!req.body || !req.body.unsplashDescription) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Unsplash description is required' 
      });
    }

    const { unsplashDescription, imageUrl } = req.body;
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    console.log('Making request to Groq API to enhance Unsplash description...');
    
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional image description writer. Your job is to take a basic image description from Unsplash and rewrite it into a more detailed, engaging, and natural description.

Rules:
- Base your description ONLY on the provided Unsplash description
- DO NOT add fictional details or make assumptions
- Make it sound more natural and engaging while staying factual
- Keep it to 2-3 sentences maximum
- Focus on what IS described, not what you imagine

Example:
Input: "Yellow car on street"
Output: "A vibrant yellow vintage car parked along a colorful street, creating a striking focal point against the urban backdrop."

Input: "Person walking in forest"
Output: "A person walks through a lush forest setting, surrounded by tall trees and natural greenery."`
        },
        {
          role: "user",
          content: `Please enhance this Unsplash image description to make it more natural and engaging:

"${unsplashDescription}"

Remember: Only enhance what's already described. Don't add new details.`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'API request failed',
        message: errorText || response.statusText
      });
    }
    
    const data = await response.json();
    console.log('Groq API Response:', JSON.stringify(data, null, 2));
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}