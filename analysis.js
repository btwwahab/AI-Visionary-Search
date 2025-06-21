// Groq API integration for image analysis - client side

class GroqService {
  constructor() {
    this.apiEndpoint = '/api/agent'; // Vercel serverless function endpoint
  }

  // Analyze image using serverless API endpoint
  async analyzeImage(imageUrl, imageDescription = '') {
    try {
      // Call the serverless function instead of direct API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, imageDescription })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      // Parse response
      const data = await response.json();
      const content = data.choices[0].message.content;

      // Extract information
      return {
        description: this.extractSection(content, 'description') || 
                     this.extractSection(content, '1') || 
                     'No description available',
        tags: this.extractTags(content) || ['No tags available'],
        mood: this.extractSection(content, 'mood') || 
              this.extractSection(content, '3') || 
              'Neutral'
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  // Helper method to extract sections from the response
  extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|\\n[0-9]|\\n[A-Za-z]+:|$)`, 'is');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  // Helper method to extract tags
  extractTags(content) {
    const tagsSection = this.extractSection(content, 'tags') || 
                        this.extractSection(content, 'content tags') || 
                        this.extractSection(content, '2');
    
    if (!tagsSection) return null;
    
    return tagsSection.split(/,|\n/)
      .map(tag => tag.replace(/^[\s\d\-•]+/, '').trim())
      .filter(tag => tag.length > 0);
  }
}

// Create global instance
window.groqService = new GroqService();
console.log('GroqService initialized (secure API implementation)');