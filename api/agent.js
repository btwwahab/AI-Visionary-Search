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
    
    console.log('Making request to Groq API for comprehensive image analysis...');
    
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert AI image analyst. Analyze the image and provide a response in EXACTLY this format with proper spacing:

🎨 VISUAL DESCRIPTION:
[Write 2-3 detailed sentences describing what you see in the image - subjects, setting, lighting, composition, colors, mood]

🏷️ CONTENT TAGS:
[List 8-10 relevant tags separated by commas - include objects, style, mood, colors, technique. Example: landscape, mountains, sunset, golden hour, peaceful, serene, nature, photography]

🎭 MOOD & ATMOSPHERE:
[Write 1-2 sentences describing the emotional tone and atmosphere the image conveys]

🎨 COLOR PALETTE:
[List 5-6 actual hex color codes with percentages in this exact format: #FF6B6B (25%), #4ECDC4 (20%), #45B7D1 (18%), #96CEB4 (15%), #FFEAA7 (12%), #DDA0DD (10%)]

📐 COMPOSITION ANALYSIS:
[Describe composition techniques like rule of thirds, leading lines, symmetry, depth of field, framing]

🎯 ARTISTIC STYLE:
[Identify the style - photography, digital art, painting, illustration, realistic, abstract, etc.]

⭐ TECHNICAL QUALITY:
[Assess lighting, focus, exposure, resolution, and overall technical execution]

🔍 NOTABLE ELEMENTS:
[Highlight 2-3 unique or interesting aspects that make this image stand out]

IMPORTANT: Use real hex color codes that match the actual colors you see in the image. Ensure each section has proper content and spacing.`
        },
        {
          role: "user",
          content: `Please analyze this image in detail: ${imageUrl}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
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