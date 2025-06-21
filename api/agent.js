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
          content: `You are an expert AI image analyst with expertise in visual composition, color theory, and artistic elements. Provide a comprehensive analysis in this exact format:

🎨 VISUAL DESCRIPTION:
[2-3 detailed sentences describing what you see, including subjects, setting, lighting, and overall composition]

🏷️ CONTENT TAGS:
[10-12 specific, relevant tags separated by commas - include objects, style, mood, technique]

🎭 MOOD & ATMOSPHERE:
[1-2 sentences describing the emotional tone, atmosphere, and feeling the image conveys]

🎨 COLOR PALETTE:
[List 5-6 dominant colors in HEX format with their approximate percentages, e.g., "#2563eb (25%), #10b981 (20%), #f59e0b (15%)"]

📐 COMPOSITION ANALYSIS:
[Brief analysis of composition techniques used - rule of thirds, leading lines, symmetry, etc.]

🎯 ARTISTIC STYLE:
[Identify the artistic style/genre - photography, digital art, painting, illustration, etc.]

⭐ TECHNICAL QUALITY:
[Brief assessment of lighting, focus, exposure, and overall technical execution]

🔍 NOTABLE ELEMENTS:
[Highlight 2-3 interesting or unique aspects that make this image stand out]`
        },
        {
          role: "user",
          content: `Analyze this image comprehensively: ${imageUrl}\nExisting description: ${imageDescription || 'No prior description available'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
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
    
    // Enhance the response with structured data
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      
      // Extract color palette information
      const colorMatch = content.match(/🎨 COLOR PALETTE:\s*\n(.*?)(?=\n\n|\n📐|$)/s);
      let colorPalette = [];
      
      if (colorMatch) {
        const colorText = colorMatch[1];
        // Extract hex colors and percentages
        const colorMatches = colorText.match(/#[0-9a-fA-F]{6}\s*\(\d+%\)/g);
        if (colorMatches) {
          colorPalette = colorMatches.map(match => {
            const [hex, percentage] = match.split(/\s*\(/);
            return {
              hex: hex.trim(),
              percentage: percentage.replace(')', '').trim()
            };
          });
        }
      }
      
      // Add structured data to response
      data.structuredAnalysis = {
        colorPalette,
        timestamp: new Date().toISOString(),
        analysisVersion: '2.0'
      };
    }
    
    console.log('Comprehensive image analysis completed successfully');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}