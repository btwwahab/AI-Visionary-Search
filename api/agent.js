const axios = require('axios');

module.exports = async (req, res) => {
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
    const { imageUrl, imageDescription } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Define system prompt for image analysis
    const systemPrompt = `You are an expert image analyst with deep knowledge of visual elements, composition, and artistic styles. Analyze images with precision and provide detailed insights.

RESPONSE STRUCTURE:
1) Provide a detailed description (2-3 sentences)
2) List 8-10 relevant content tags separated by commas
3) Describe the mood and tone of the image (1 sentence)`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama3-8b-8192",
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
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Image Analysis API Error:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to analyze image'
    });
  }
};