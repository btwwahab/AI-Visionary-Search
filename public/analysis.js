class GroqService {
  constructor() {
    this.apiEndpoint = '/api/agent';
  }

  async analyzeImage(imageUrl, imageDescription = '') {
    try {
      console.log('Analyzing image:', imageUrl);

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

    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error; // Re-throw to let the calling function handle it
    }
  }

  extractDescription(content) {
    const patterns = [
      /🎨 VISUAL DESCRIPTION:\s*\n(.*?)(?=\n\n|\n🏷️|$)/s,
      /description[:\s]+(.*?)(?=\n|$)/i,
      /^(.*?)(?=\n.*tags|$)/is
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences[0] ? sentences[0].trim() + '.' : 'A visually compelling image with rich details and composition.';
  }

  extractTags(content) {
    const patterns = [
      /🏷️ CONTENT TAGS:\s*\n(.*?)(?=\n\n|\n🎭|$)/s,
      /tags[:\s]+(.*?)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1]
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map(tag => tag.trim().replace(/^[\s\d\-•\.\)]+/, ''))
          .filter(tag => tag.length > 0)
          .slice(0, 12);
      }
    }

    return ['artistic', 'visual', 'creative', 'composition', 'digital'];
  }

  extractMood(content) {
    const patterns = [
      /🎭 MOOD & ATMOSPHERE:\s*\n(.*?)(?=\n\n|\n🎨|$)/s,
      /mood[:\s]+(.*?)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    return 'Evokes a sense of artistic expression and visual harmony.';
  }

  extractColorPalette(content) {
    const patterns = [
      /🎨 COLOR PALETTE:\s*\n(.*?)(?=\n\n|\n📐|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const colorText = match[1];
        const colorMatches = colorText.match(/#[0-9a-fA-F]{6}\s*\(\d+%\)/g);
        
        if (colorMatches) {
          return colorMatches.map(match => {
            const [hex, percentage] = match.split(/\s*\(/);
            return {
              hex: hex.trim(),
              percentage: percentage.replace(')', '').trim()
            };
          });
        }
      }
    }

    // Default color palette if none extracted
    return [
      { hex: '#3b82f6', percentage: '25%' },
      { hex: '#10b981', percentage: '20%' },
      { hex: '#f59e0b', percentage: '15%' },
      { hex: '#8b5cf6', percentage: '15%' },
      { hex: '#ef4444', percentage: '15%' },
      { hex: '#6b7280', percentage: '10%' }
    ];
  }

  extractComposition(content) {
    const patterns = [
      /📐 COMPOSITION ANALYSIS:\s*\n(.*?)(?=\n\n|\n🎯|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    return 'Well-balanced composition with thoughtful element placement.';
  }

  extractArtisticStyle(content) {
    const patterns = [
      /🎯 ARTISTIC STYLE:\s*\n(.*?)(?=\n\n|\n⭐|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    return 'Contemporary digital art style.';
  }

  extractTechnicalQuality(content) {
    const patterns = [
      /⭐ TECHNICAL QUALITY:\s*\n(.*?)(?=\n\n|\n🔍|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    return 'Good technical execution with proper exposure and focus.';
  }

  extractNotableElements(content) {
    const patterns = [
      /🔍 NOTABLE ELEMENTS:\s*\n(.*?)(?=\n\n|$)/s
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^\[|\]$/g, '');
      }
    }

    return 'Unique visual elements that create visual interest and engagement.';
  }
}

// Make sure it's available as both GroqService and groqService for compatibility
window.GroqService = GroqService;
window.groqService = new GroqService();
console.log('GroqService initialized and available globally');