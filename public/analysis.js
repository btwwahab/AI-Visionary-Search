class GroqService {
  constructor() {
    this.apiEndpoint = '/api/agent';
  }

  async analyzeImage(imageUrl, imageDescription = '') {
    try {
      console.log('🔍 Analyzing image:', imageUrl);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl, imageDescription })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response');
      }

      const content = data.choices[0].message.content;
      console.log('📝 Raw AI response:', content);

      // Parse only description and colors
      const analysis = this.parseSimpleAnalysis(content);
      console.log('✅ Parsed analysis:', analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      throw error;
    }
  }

  parseSimpleAnalysis(content) {
    return {
      description: this.extractDescription(content),
      colorPalette: this.extractColorPalette(content),
      fullAnalysis: content
    };
  }

  extractDescription(content) {
    const patterns = [
      /🎨 VISUAL DESCRIPTION:\s*\n(.*?)(?=\n\n🎨|\n🎨|$)/s,
      /VISUAL DESCRIPTION:\s*\n(.*?)(?=\n\n|$)/s,
      /Description:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let description = match[1].trim()
          .replace(/^\[|\]$/g, '')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ');
        console.log('📖 Extracted description:', description);
        return description;
      }
    }

    // Fallback: try to get first meaningful paragraph
    const lines = content.split('\n').filter(line => 
      line.trim().length > 30 && 
      !line.includes('🎨') && 
      !line.includes('COLOR PALETTE')
    );
    
    if (lines.length > 0) {
      return lines[0].trim();
    }

    return 'A visually compelling image with rich details and artistic composition.';
  }

  extractColorPalette(content) {
    console.log('🎨 Extracting actual colors from content...');
    
    const patterns = [
      /🎨 COLOR PALETTE:\s*\n(.*?)(?=\n\n|$)/s,
      /COLOR PALETTE:\s*\n(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const colorText = match[1];
        console.log('🎨 Color text section:', colorText);
        
        // Enhanced regex patterns to match various color formats
        const colorPatterns = [
          /#[0-9a-fA-F]{6}\s*\(\s*\d+%\s*\)/g,  // #FF6B6B (25%)
          /#[0-9a-fA-F]{6}\s*-\s*\d+%/g,        // #FF6B6B - 25%
          /#[0-9a-fA-F]{6}\s*:\s*\d+%/g,        // #FF6B6B: 25%
          /#[0-9a-fA-F]{6}/g,                    // Just hex codes
          /#[0-9a-fA-F]{3}\b/g                   // Short hex codes like #FFF
        ];
        
        for (let i = 0; i < colorPatterns.length; i++) {
          const colorMatches = colorText.match(colorPatterns[i]);
          console.log(`🎨 Pattern ${i + 1} matches:`, colorMatches);
          
          if (colorMatches && colorMatches.length > 0) {
            const colors = colorMatches.map((match, index) => {
              let hex, percentage;
              
              // Clean the hex code first
              let cleanHex = match.match(/#[0-9a-fA-F]{3,6}/)[0];
              
              // Convert 3-digit hex to 6-digit
              if (cleanHex.length === 4) {
                cleanHex = '#' + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
              }
              
              if (match.includes('(')) {
                const percentMatch = match.match(/\((\d+)%\)/);
                percentage = percentMatch ? percentMatch[1] + '%' : `${Math.max(30 - index * 5, 5)}%`;
              } else if (match.includes('-')) {
                const percentMatch = match.match(/-\s*(\d+)%/);
                percentage = percentMatch ? percentMatch[1] + '%' : `${Math.max(30 - index * 5, 5)}%`;
              } else if (match.includes(':')) {
                const percentMatch = match.match(/:\s*(\d+)%/);
                percentage = percentMatch ? percentMatch[1] + '%' : `${Math.max(30 - index * 5, 5)}%`;
              } else {
                percentage = `${Math.max(30 - index * 5, 5)}%`;
              }
              
              return {
                hex: cleanHex,
                percentage: percentage
              };
            }).slice(0, 6); // Limit to 6 colors
            
            console.log('✅ Extracted actual colors:', colors);
            return colors.length > 0 ? colors : null;
          }
        }
      }
    }

    // If no colors found, return null instead of defaults
    console.log('❌ No actual colors found in AI response');
    return null;
  }
}

// Make sure it's available globally
window.GroqService = GroqService;
window.groqService = new GroqService();
console.log('✅ GroqService initialized and available globally');