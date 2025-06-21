class GroqService {
  constructor() {
    this.apiEndpoint = '/api/agent';
  }

  async analyzeImage(imageUrl, imageDescription = '') {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, imageDescription })
      });

      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error('API Response Error:', text);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: `Server error: ${response.status}` };
        }
        
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      // Parse response
      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }
      
      const content = data.choices[0].message.content;

      return {
        description: this.extractSection(content, 'description') || 
                     this.extractSection(content, '1') || 
                     'AI analysis not available at the moment',
        tags: this.extractTags(content) || ['general', 'image'],
        mood: this.extractSection(content, 'mood') || 
              this.extractSection(content, '3') || 
              'Neutral'
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|\\n[0-9]|\\n[A-Za-z]+:|$)`, 'is');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  extractTags(content) {
    const tagsSection = this.extractSection(content, 'tags') || 
                        this.extractSection(content, 'content tags') || 
                        this.extractSection(content, '2');
    
    if (!tagsSection) return null;
    
    return tagsSection.split(/,|\n/)
      .map(tag => tag.replace(/^[\s\d\-•]+/, '').trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }
}

window.groqService = new GroqService();
console.log('GroqService initialized (secure API implementation)');