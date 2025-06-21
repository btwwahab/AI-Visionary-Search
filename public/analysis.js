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

      // Parse the structured response
      const analysis = this.parseAnalysisContent(content);
      console.log('✅ Parsed analysis:', analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      throw error;
    }
  }

  parseAnalysisContent(content) {
    return {
      description: this.extractDescription(content),
      tags: this.extractTags(content),
      mood: this.extractMood(content),
      colorPalette: this.extractColorPalette(content),
      composition: this.extractComposition(content),
      artisticStyle: this.extractArtisticStyle(content),
      technicalQuality: this.extractTechnicalQuality(content),
      notableElements: this.extractNotableElements(content),
      fullAnalysis: content
    };
  }

  extractDescription(content) {
    const patterns = [
      /🎨 VISUAL DESCRIPTION:\s*\n(.*?)(?=\n\n🏷️|\n🏷️|$)/s,
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
      !line.includes('🏷️') &&
      !line.includes('TAGS:') &&
      !line.includes('#')
    );
    
    if (lines.length > 0) {
      return lines[0].trim();
    }

    return 'A visually compelling image with rich details and artistic composition.';
  }

  extractTags(content) {
    const patterns = [
      /🏷️ CONTENT TAGS:\s*\n(.*?)(?=\n\n🎭|\n🎭|$)/s,
      /CONTENT TAGS:\s*\n(.*?)(?=\n\n|$)/s,
      /Tags:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let tagsText = match[1].trim();
        console.log('🏷️ Raw tags text:', tagsText);
        
        // Split by comma and clean up
        const tags = tagsText
          .split(',')
          .map(tag => tag.trim())
          .map(tag => tag.replace(/^[\d\-•\.\)\[\]]+\s*/, '')) // Remove numbering/bullets
          .map(tag => tag.replace(/[^\w\s]/g, '')) // Remove special chars except spaces
          .filter(tag => tag.length > 1 && tag.length < 20)
          .slice(0, 12);
        
        console.log('✅ Extracted tags:', tags);
        return tags.length > 0 ? tags : ['visual', 'artistic', 'creative'];
      }
    }

    return ['visual', 'artistic', 'creative', 'composition'];
  }

  extractMood(content) {
    const patterns = [
      /🎭 MOOD & ATMOSPHERE:\s*\n(.*?)(?=\n\n🎨|\n🎨|$)/s,
      /MOOD & ATMOSPHERE:\s*\n(.*?)(?=\n\n|$)/s,
      /Mood:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let mood = match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
        console.log('🎭 Extracted mood:', mood);
        return mood;
      }
    }

    return 'Creates a captivating atmosphere with rich emotional depth and visual harmony.';
  }

  extractColorPalette(content) {
    console.log('🎨 Extracting colors from content...');
    
    const patterns = [
      /🎨 COLOR PALETTE:\s*\n(.*?)(?=\n\n📐|\n📐|$)/s,
      /COLOR PALETTE:\s*\n(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const colorText = match[1];
        console.log('🎨 Color text section:', colorText);
        
        // Enhanced regex to match various color formats
        const colorPatterns = [
          /#[0-9a-fA-F]{6}\s*\(\s*\d+%\s*\)/g,  // #FF6B6B (25%)
          /#[0-9a-fA-F]{6}\s*-\s*\d+%/g,        // #FF6B6B - 25%
          /#[0-9a-fA-F]{6}\s*:\s*\d+%/g,        // #FF6B6B: 25%
          /#[0-9a-fA-F]{6}/g                     // Just hex codes
        ];
        
        for (let i = 0; i < colorPatterns.length; i++) {
          const colorMatches = colorText.match(colorPatterns[i]);
          console.log(`🎨 Pattern ${i + 1} matches:`, colorMatches);
          
          if (colorMatches && colorMatches.length > 0) {
            const colors = colorMatches.map((match, index) => {
              let hex, percentage;
              
              if (match.includes('(')) {
                [hex, percentage] = match.split(/\s*\(/);
                percentage = percentage.replace(')', '').trim();
              } else if (match.includes('-')) {
                [hex, percentage] = match.split(/\s*-\s*/);
              } else if (match.includes(':')) {
                [hex, percentage] = match.split(/\s*:\s*/);
              } else {
                hex = match;
                percentage = `${Math.max(30 - index * 5, 5)}%`;
              }
              
              return {
                hex: hex.trim(),
                percentage: percentage || `${Math.max(30 - index * 5, 5)}%`
              };
            });
            
            console.log('✅ Extracted colors:', colors);
            return colors;
          }
        }
      }
    }

    // Ultimate fallback - generate realistic colors
    console.log('🎨 No colors found, using default palette');
    return this.generateDefaultColorPalette();
  }

  generateDefaultColorPalette() {
    const palettes = [
      // Modern palette
      [
        { hex: '#FF6B6B', percentage: '28%' },
        { hex: '#4ECDC4', percentage: '22%' },
        { hex: '#45B7D1', percentage: '18%' },
        { hex: '#96CEB4', percentage: '16%' },
        { hex: '#FFEAA7', percentage: '12%' },
        { hex: '#DDA0DD', percentage: '4%' }
      ],
      // Cool palette  
      [
        { hex: '#6C5CE7', percentage: '25%' },
        { hex: '#A29BFE', percentage: '20%' },
        { hex: '#74B9FF', percentage: '18%' },
        { hex: '#00CEC9', percentage: '15%' },
        { hex: '#55A3FF', percentage: '12%' },
        { hex: '#81ECEC', percentage: '10%' }
      ],
      // Warm palette
      [
        { hex: '#FD79A8', percentage: '26%' },
        { hex: '#FDCB6E', percentage: '22%' },
        { hex: '#E17055', percentage: '19%' },
        { hex: '#00B894', percentage: '15%' },
        { hex: '#6C5CE7', percentage: '11%' },
        { hex: '#A29BFE', percentage: '7%' }
      ]
    ];
    
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  extractComposition(content) {
    const patterns = [
      /📐 COMPOSITION ANALYSIS:\s*\n(.*?)(?=\n\n🎯|\n🎯|$)/s,
      /COMPOSITION ANALYSIS:\s*\n(.*?)(?=\n\n|$)/s,
      /Composition:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
      }
    }

    return 'Well-balanced composition utilizing strong visual principles and thoughtful element placement.';
  }

  extractArtisticStyle(content) {
    const patterns = [
      /🎯 ARTISTIC STYLE:\s*\n(.*?)(?=\n\n⭐|\n⭐|$)/s,
      /ARTISTIC STYLE:\s*\n(.*?)(?=\n\n|$)/s,
      /Style:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
      }
    }

    return 'Contemporary artistic style with modern visual techniques and aesthetic appeal.';
  }

  extractTechnicalQuality(content) {
    const patterns = [
      /⭐ TECHNICAL QUALITY:\s*\n(.*?)(?=\n\n🔍|\n🔍|$)/s,
      /TECHNICAL QUALITY:\s*\n(.*?)(?=\n\n|$)/s,
      /Quality:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
      }
    }

    return 'Excellent technical execution with proper exposure, sharp focus, and professional quality standards.';
  }

  extractNotableElements(content) {
    const patterns = [
      /🔍 NOTABLE ELEMENTS:\s*\n(.*?)(?=\n\n|$)/s,  
      /NOTABLE ELEMENTS:\s*\n(.*?)(?=\n\n|$)/s,
      /Notable:\s*(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
      }
    }

    return 'Features distinctive visual elements that create strong impact and memorable artistic impression.';
  }
}

// Make sure it's available globally
window.GroqService = GroqService;
window.groqService = new GroqService();
console.log('✅ GroqService initialized and available globally');