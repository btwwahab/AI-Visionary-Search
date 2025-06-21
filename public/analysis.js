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
        description: this.extractDescription(content) || 'AI analysis completed',
        tags: this.extractTags(content) || ['image', 'analysis'],
        mood: this.extractMood(content) || 'Neutral tone'
      };

    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        description: 'Unable to analyze this image at the moment.',
        tags: ['image', 'visual'],
        mood: 'Analysis unavailable'
      };
    }
  }

  extractDescription(content) {
    const patterns = [
      /1\)\s*(.*?)(?=\n2\)|$)/s,
      /description[:\s]+(.*?)(?=\n|$)/i,
      /^(.*?)(?=\n.*tags|$)/is
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^[0-9\.\)\s]+/, '');
      }
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences[0] ? sentences[0].trim() + '.' : null;
  }

  extractTags(content) {
    const patterns = [
      /2\)\s*(.*?)(?=\n3\)|$)/s,
      /tags[:\s]+(.*?)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(',')
          .map(tag => tag.trim().replace(/^[\s\d\-•\.\)]+/, ''))
          .filter(tag => tag.length > 0)
          .slice(0, 10);
      }
    }

    return ['image', 'visual', 'content'];
  }

  extractMood(content) {
    const patterns = [
      /3\)\s*(.*?)(?=\n|$)/s,
      /mood[:\s]+(.*?)(?=\n|$)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^[0-9\.\)\s]+/, '');
      }
    }

    return 'Neutral atmosphere';
  }
}

window.groqService = new GroqService();
console.log('GroqService initialized (secure API implementation)');