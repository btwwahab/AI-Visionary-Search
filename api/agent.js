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
    if (!req.body || !req.body.imageUrl) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Image URL is required' 
      });
    }

    const { imageUrl, imageDescription } = req.body;
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    console.log('Making request to Groq API for image color analysis...');
    
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an AI image content analyzer with FACTUAL REPORTING ONLY. Never make up information or tell stories.

When analyzing an image, provide ONLY these two sections with STRICTLY FACTUAL information:

🎨 VISUAL DESCRIPTION:
[OBJECTIVELY describe ONLY what you actually see in the image. Include visible objects, people, setting and main visual elements. NO storytelling, NO assumptions, NO embellishments. Keep it to 1-2 factual sentences about what is visibly present.]

🎨 COLOR PALETTE:
[Extract the most prominent colors from the image as accurate hex codes with percentages. Format: #HEX (XX%). Example: #3B82F6 (25%), #1E3A8A (20%), etc. Provide 5-6 colors that genuinely match what appears in the image.]

IMPORTANT: If you cannot accurately determine what's in the image, your description should state "This appears to be [basic description]" rather than inventing details.`
        },
        {
          role: "user",
          content: `Analyze this image: ${imageUrl}

Please be 100% factual about what you actually see. Do not invent stories or make assumptions. Only describe the visible objects and colors you can directly observe.`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
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