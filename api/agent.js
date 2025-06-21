const axios = require('axios');

export default async function handler(req, res) {
  // Add detailed logging right at the start
  console.log('=== FUNCTION START ===');
  console.log('All environment variables:', Object.keys(process.env));
  console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
  console.log('GROQ_API_KEY value (first 10 chars):', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'undefined');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 200');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, imageDescription } = req.body;

    if (!imageUrl) {
      console.log('❌ Missing imageUrl');
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.log('❌ GROQ_API_KEY is missing from environment');
      return res.status(500).json({ 
        error: 'GROQ_API_KEY is not configured',
        debug: 'Environment variable not found in process.env'
      });
    }

    console.log('✅ All validations passed, making API request...');

    const systemPrompt = `You are an expert image analyst. Analyze images and provide:

1) A detailed description (2-3 sentences)
2) 8-10 relevant content tags separated by commas  
3) The mood and tone of the image (1 sentence)

Format your response clearly with these three sections.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this image: ${imageUrl}\nExisting description: ${imageDescription || ''}` 
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

    console.log('✅ Groq API success');
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('❌ Error details:');
    console.error('- Message:', error.message);
    console.error('- Code:', error.code);
    console.error('- Response status:', error.response?.status);
    console.error('- Response data:', JSON.stringify(error.response?.data, null, 2));

    return res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'Analysis failed',
      debug: {
        code: error.code,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      }
    });
  }
}