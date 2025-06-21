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
          content: `You are an expert AI color analyst. Analyze the image and provide ONLY these two sections:

🎨 VISUAL DESCRIPTION:
[Write 2-3 detailed sentences describing what you see in the image - subjects, setting, lighting, composition]

🎨 COLOR PALETTE:
[Extract the actual dominant colors from the image and list them as hex codes with percentages. Use this exact format: #FF6B6B (25%), #4ECDC4 (20%), #45B7D1 (18%), #96CEB4 (15%), #FFEAA7 (12%), #DDA0DD (10%)]

CRITICAL: Extract real hex color codes that actually match the colors visible in the image. Look at the actual pixel colors, not generic color palettes. Provide 5-6 colors that are genuinely present in the image.`
        },
        {
          role: "user",
          content: `Please analyze the colors and describe this image: ${imageUrl}`
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