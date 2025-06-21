const axios = require('axios');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    console.log('Environment check:', process.env.GROQ_API_KEY ? 'API Key exists' : 'API Key missing');

    const { imageUrl, imageDescription } = req.body;

    if (!imageUrl) {
      console.log('Missing imageUrl in request');
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.log('GROQ_API_KEY environment variable is missing');
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const systemPrompt = `You are an expert image analyst with deep knowledge of visual elements, composition, and artistic styles. Analyze images with precision and provide detailed insights.

RESPONSE STRUCTURE:
1) Provide a detailed description (2-3 sentences)
2) List 8-10 relevant content tags separated by commas
3) Describe the mood and tone of the image (1 sentence)`;

    console.log('Making request to Groq API...');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { 
            role: "user", 
            content: `Analyze this image: ${imageUrl}\nExisting description: ${imageDescription || ''}\n\nProvide the analysis following the structure in your instructions.` 
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    console.log('Groq API response received successfully');
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout' });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid API key configuration' });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to analyze image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}