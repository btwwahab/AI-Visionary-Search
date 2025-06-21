// API Access Key
const accessKey = "6RrtS8-C4R9NtR1P-1jiWVeagN-8bo6Y0J6Fb7KD05s";

// DOM Elements
const searchForm = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");
const searchResult = document.getElementById("search-result");
const showMoreBtn = document.getElementById("show-more-btn");
const loader = document.querySelector(".loader");
const noResults = document.getElementById("no-results");
const aiAssistant = document.getElementById("ai-assistant");
const aiChatPanel = document.getElementById("ai-chat-panel");
const chatClose = document.getElementById("chat-close");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input-field");
const chatSend = document.getElementById("chat-send");
const voiceSearch = document.getElementById("voice-search");
const imageModal = document.getElementById("image-modal");
const modalClose = document.getElementById("modal-close");
const modalImage = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const modalResolution = document.getElementById("modal-resolution");
const modalAspect = document.getElementById("modal-aspect");
const modalDownload = document.getElementById("modal-download");
const modalShare = document.getElementById("modal-share");
const categoryPills = document.querySelectorAll(".category-pill");

// State Variables
let keyword = "";
let page = 1;
let isListening = false;
let currentCategories = [];


function startCategoryRefresh() {
  // Fetch immediately on reload
  fetchCategories();

  // Then refresh every hour
  setInterval(fetchCategories, 3600000);

  // Also fetch when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchCategories();
    }
  });

  // Optional: Fetch on window focus
  window.addEventListener('focus', fetchCategories);
}
// Initialize the app
function init() {
  // Hide loader and show more button initially
  loader.style.display = "none";
  showMoreBtn.style.display = "none";
  noResults.style.display = "none";
  // Animate metrics on load
  animateMetrics();

  // Initialize neural network visualization
  initNeuralNetwork();

  // Initialize particles
  initParticles();

  // Add event listeners
  setupEventListeners();

  fetchCategories();
  startCategoryRefresh();

}

// Set up all event listeners
function setupEventListeners() {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    page = 1;
    searchImages();
  });

  showMoreBtn.addEventListener("click", () => {
    page++;
    searchImages();
  });

  aiAssistant.addEventListener("click", toggleChatPanel);
  chatClose.addEventListener("click", toggleChatPanel);

  chatSend.addEventListener("click", sendChatMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });


  voiceSearch.addEventListener("click", toggleVoiceRecognition);

  modalClose.addEventListener("click", closeImageModal);
  modalDownload.addEventListener("click", downloadImage);
  modalShare.addEventListener("click", shareImage);

  categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
      searchBox.value = pill.dataset.category;
      page = 1;
      searchImages();
    });
  });

  // Handle image click to open modal
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("result-img")) {
      openImageModal(e.target);
    }
  });
}

// Download image function
async function downloadImage() {
  try {
    // Get the current image URL and title
    const imageUrl = modalImage.src;
    const imageName = modalTitle.textContent.trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') || 'neural_vision_image';

    // Show download status in modal
    const originalText = modalDownload.innerHTML;
    modalDownload.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12V19M12 19L15 16M12 19L9 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 16C5.79086 16 4 14.2091 4 12C4 10.0929 5.33487 8.4976 7.12071 8.10094C7.04071 7.74519 7 7.37683 7 7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7C17 7.37683 16.9593 7.74519 16.8793 8.10094C18.6651 8.4976 20 10.0929 20 12C20 14.2091 18.2091 16 16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Downloading...
    `;

    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();

    // Create an object URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // Create a download link and click it
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${imageName}.jpg`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

    // Reset button
    modalDownload.innerHTML = originalText;

    // Add message to chat if chat panel is open
    if (aiChatPanel.classList.contains("active")) {
      setTimeout(() => {
        addAIMessage(`I've downloaded the "${imageName}" image for you.`);
      }, 500);
    }
  } catch (error) {
    console.error('Download failed:', error);

    // Reset button
    modalDownload.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16L12 8M12 16L16 12M12 16L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2"/>
      </svg>
      Download
    `;

    // Add error message to chat if chat panel is open
    if (aiChatPanel.classList.contains("active")) {
      addAIMessage("I couldn't download the image. There might be permission restrictions on this image.");
    }
  }
}

async function shareImage() {
  try {
    // Get the current image URL and title
    const imageUrl = modalImage.src;
    const imageTitle = modalTitle.textContent.trim();

    // Show sharing status in modal
    const originalText = modalShare.innerHTML;
    modalShare.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7V17M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Sharing...
    `;

    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title: 'Image shared from NeuralVision',
        text: imageTitle,
        url: imageUrl
      });

      // Reset button
      modalShare.innerHTML = originalText;

      // Add message to chat if chat panel is open
      if (aiChatPanel.classList.contains("active")) {
        setTimeout(() => {
          addAIMessage(`I've shared the "${imageTitle}" image for you.`);
        }, 500);
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(imageUrl);

      // Show success message
      modalShare.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
      `;

      // Reset button after delay
      setTimeout(() => {
        modalShare.innerHTML = originalText;
      }, 2000);

      // Add message to chat if chat panel is open
      if (aiChatPanel.classList.contains("active")) {
        setTimeout(() => {
          addAIMessage(`I've copied the image URL to your clipboard.`);
        }, 500);
      }
    }
  } catch (error) {
    console.error('Share failed:', error);

    // Show error
    modalShare.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Failed
    `;

    // Reset button after delay
    setTimeout(() => {
      modalShare.innerHTML = originalText;
    }, 2000);

    // Add error message to chat if chat panel is open
    if (aiChatPanel.classList.contains("active")) {
      addAIMessage("I couldn't share the image. There might be permission restrictions or your browser doesn't support sharing.");
    }
  }
}

// Search images function
async function searchImages() {
  keyword = searchBox.value.trim() || "random";

  if (page === 1) {
    searchResult.innerHTML = "";
    showAISearchAnimation();
  }

  loader.style.display = "flex";
  noResults.style.display = "none";

  // Construct the search URL - removed content_filter parameter as it's not supported
  let url = `https://api.unsplash.com/search/photos?page=${page}&query=${keyword}&client_id=${accessKey}&per_page=12`;

  try {
    const response = await fetch(url);

    // If response is not ok, throw an error
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Hide loader after results are fetched
    loader.style.display = "none";

    // Check if data and results exist before accessing them
    if (!data || !data.results) {
      console.error("Invalid API response:", data);
      noResults.style.display = "flex";
      showMoreBtn.style.display = "none";
      return;
    }

    if (data.results.length === 0 && page === 1) {
      noResults.style.display = "flex";
      showMoreBtn.style.display = "none";
      return;
    }

    displayImages(data.results);

    if (data.total_pages > page) {
      showMoreBtn.style.display = "block";
    } else {
      showMoreBtn.style.display = "none";
    }

    // Add AI search observation to chat
    if (page === 1) {
      setTimeout(() => {
        addAIMessage(`I found ${data.total} images for "${keyword}". Here are some of the best results.`);
      }, 1000);
    }

  } catch (error) {
    console.error("Error fetching images:", error);
    loader.style.display = "none";
    noResults.style.display = "flex";

    // Show error in chat
    addAIMessage("I encountered an error while searching for images. Please try again.");
  }
}

// Display images in the grid (updated to store better descriptions)
function displayImages(results) {
  // Ensure results exist and is an array
  if (!Array.isArray(results)) {
    console.error("Invalid results:", results);
    return;
  }

  results.forEach(result => {
    const imageBox = document.createElement("div");
    imageBox.classList.add("image-box");
    imageBox.dataset.aiLabels = generateRandomAILabels();

    // Add a small delay for each image to create a staggered loading effect
    setTimeout(() => {
      imageBox.classList.add("loaded");
    }, Math.random() * 500);

    const image = document.createElement("img");
    image.src = result.urls.regular;
    image.alt = result.alt_description || "Unsplash Image";
    image.classList.add("result-img");
    image.dataset.full = result.urls.full;

    // Store the best available description
    const bestDescription = result.description ||
      result.alt_description ||
      `Photo by ${result.user.name}` ||
      "Beautiful image from Unsplash";

    image.dataset.description = bestDescription;
    image.dataset.width = result.width;
    image.dataset.height = result.height;

    const overlay = document.createElement("div");
    overlay.classList.add("image-overlay");

    const photographer = document.createElement("div");
    photographer.classList.add("photographer");
    photographer.textContent = `📸 ${result.user.name}`;

    const aiTag = document.createElement("div");
    aiTag.classList.add("ai-tag");
    aiTag.innerHTML = `<span class="pulse-dot"></span>Real Colors`;

    overlay.appendChild(photographer);
    overlay.appendChild(aiTag);

    imageBox.appendChild(image);
    imageBox.appendChild(overlay);

    searchResult.appendChild(imageBox);
  });
}

// Toggle chat panel
function toggleChatPanel() {
  aiChatPanel.classList.toggle("active");

  // If opening the panel, scroll to the bottom of messages
  if (aiChatPanel.classList.contains("active")) {
    scrollToBottom();

    // Add welcome message if this is the first time
    if (chatMessages.children.length <= 1) {
      setTimeout(() => {
        addAIMessage("I see you're looking for images. How can I help refine your search?");
      }, 500);
    }
  }
}

// Send chat message
function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message to chat
  const userMessageEl = document.createElement("div");
  userMessageEl.classList.add("message", "user");
  userMessageEl.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  chatMessages.appendChild(userMessageEl);

  // Clear input
  chatInput.value = "";

  // Scroll to bottom
  scrollToBottom();

  // Process message and respond
  processUserMessage(message);
}

// Process user message and generate AI response
function processUserMessage(message) {
  // Add typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message", "system", "typing");
  typingIndicator.innerHTML = `
    <div class="message-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 9H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingIndicator);
  scrollToBottom();

  // Simulate thinking and then respond
  setTimeout(() => {
    // Remove typing indicator
    chatMessages.removeChild(typingIndicator);

    // Basic message processing logic
    let response;
    message = message.toLowerCase();

    if (message.includes("search") || message.includes("find") || message.includes("look for")) {
      const searchTerm = message.replace(/(search for|search|find|look for|images of|pictures of)/gi, "").trim();
      if (searchTerm) {
        response = `I'll search for "${searchTerm}" images right away.`;
        // Populate search box and trigger search
        searchBox.value = searchTerm;
        searchImages();
      } else {
        response = "What kind of images would you like to search for?";
      }
    } else if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      response = "Hello! I'm your AI image search assistant. What kind of images are you looking for today?";
    } else if (message.includes("thank") || message.includes("thanks")) {
      response = "You're welcome! Let me know if you need to find any other images.";
    } else if (message.includes("help") || message.includes("how")) {
      response = "I can help you search for images. Try asking me to 'find images of mountains' or 'search for cute animals'. You can also use the search bar directly or browse trending categories.";
    } else if (message.includes("feature") || message.includes("can you")) {
      response = "I can search for images, analyze visual content, process natural language queries, and help you discover new visual content based on your preferences.";
    } else {
      // Assume it's a search query
      response = `I'll look for images related to "${message}".`;
      // Populate search box and trigger search
      searchBox.value = message;
      searchImages();
    }

    // Add AI response
    addAIMessage(response);
  }, 1000 + Math.random() * 1000); // Random delay to simulate thinking
}

// Add AI message to chat
function addAIMessage(message) {
  const aiMessageEl = document.createElement("div");
  aiMessageEl.classList.add("message", "system");
  aiMessageEl.innerHTML = `
    <div class="message-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 9H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  chatMessages.appendChild(aiMessageEl);
  scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Toggle search options panel
// function toggleSearchOptions() {
//   searchOptions.classList.toggle("active");
// }

// Toggle voice recognition
function toggleVoiceRecognition() {
  if (!isListening) {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'en-US';
      recognition.continuous = false;

      // Show voice waves
      document.querySelector('.voice-waves').classList.add('active');
      document.querySelector('.search-animation').textContent = "Listening...";
      document.querySelector('.search-animation').classList.add('listening');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchBox.value = transcript;
        // Hide voice waves
        document.querySelector('.voice-waves').classList.remove('active');
        document.querySelector('.search-animation').textContent = "Neural Processing...";
        document.querySelector('.search-animation').classList.remove('listening');

        // Trigger search
        page = 1;
        searchImages();
      };

      recognition.onend = () => {
        // Hide voice waves
        document.querySelector('.voice-waves').classList.remove('active');
        document.querySelector('.search-animation').textContent = "Neural Processing...";
        document.querySelector('.search-animation').classList.remove('listening');
        isListening = false;
      };

      recognition.start();
      isListening = true;
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  } else {
    // Already listening - implementation would need to stop the recognition
    document.querySelector('.voice-waves').classList.remove('active');
    document.querySelector('.search-animation').textContent = "Neural Processing...";
    document.querySelector('.search-animation').classList.remove('listening');
    isListening = false;
  }
}

// Show AI search animation
function showAISearchAnimation() {
  const pulseElement = document.querySelector('.pulse');
  const searchAnimationElement = document.querySelector('.search-animation');

  if (pulseElement) pulseElement.classList.add('active');
  if (searchAnimationElement) searchAnimationElement.style.opacity = 1;

  setTimeout(() => {
    if (pulseElement) pulseElement.classList.remove('active');
    if (searchAnimationElement) searchAnimationElement.style.opacity = 0;
  }, 3000);
}

// Open image modal
// Open image modal (updated to pass Unsplash description)
async function openImageModal(image) {
  const imageModal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalResolution = document.getElementById('modal-resolution');
  const modalAspect = document.getElementById('modal-aspect');
  const analysisContent = document.getElementById('analysis-content');
  const analysisLoading = document.getElementById('analysis-loading');

  // Get the actual Unsplash description
  const unsplashDescription = image.dataset.description || image.alt || "Beautiful image from Unsplash";

  // Set image data
  modalImage.src = image.dataset.full;
  modalTitle.textContent = image.dataset.description || "Beautiful Image";
  modalResolution.textContent = `${image.dataset.width} x ${image.dataset.height}`;
  modalAspect.textContent = calculateAspectRatio(image.dataset.width, image.dataset.height);

  // Show modal
  imageModal.classList.add('active');
  document.body.classList.add('modal-open');

  // Start AI analysis with Unsplash description
  await performAIAnalysisWithDescription(image.src, analysisContent, analysisLoading, unsplashDescription);
}

// Enhanced AI analysis function with Unsplash description enhancement
async function performAIAnalysisWithDescription(imageUrl, contentContainer, loadingContainer, unsplashDescription) {
  try {
    // Show loading state
    loadingContainer.style.display = 'flex';
    contentContainer.innerHTML = '';

    // Extract real colors from the image using Canvas
    const colorPalette = await analyzeImageColors(imageUrl);

    // Enhance the Unsplash description using Groq
    let enhancedDescription = unsplashDescription || "Image from Unsplash collection";

    if (unsplashDescription && unsplashDescription.length > 5) {
      try {
        console.log('🤖 Enhancing description with Groq:', unsplashDescription);

        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            unsplashDescription: unsplashDescription,
            imageUrl: imageUrl
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            enhancedDescription = data.choices[0].message.content.trim();
            console.log('✨ Enhanced description:', enhancedDescription);
          }
        } else {
          console.log('⚠️ Groq enhancement failed, using original description');
        }
      } catch (error) {
        console.log('⚠️ Description enhancement error, using original:', error);
      }
    }

    // Hide loading
    loadingContainer.style.display = 'none';

    // Display the analysis (enhanced description + real colors)
    displayEnhancedAnalysis({
      description: enhancedDescription,
      colorPalette: colorPalette,
      originalDescription: unsplashDescription
    }, contentContainer);

  } catch (error) {
    console.error('Analysis failed:', error);
    loadingContainer.style.display = 'none';
    contentContainer.innerHTML = `
      <div class="analysis-error">
        <div class="error-icon">🔍</div>
        <div class="error-title">Analysis Unavailable</div>
        <div class="error-message">
          Unable to extract colors from this image.
        </div>
        <button class="retry-analysis-btn" onclick="performAIAnalysisWithDescription('${imageUrl}', document.getElementById('analysis-content'), document.getElementById('analysis-loading'), '${unsplashDescription}')">
          Try Again
        </button>
      </div>
    `;
  }
}

// Open image modal (updated to pass Unsplash description)
async function openImageModal(image) {
  const imageModal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalResolution = document.getElementById('modal-resolution');
  const modalAspect = document.getElementById('modal-aspect');
  const analysisContent = document.getElementById('analysis-content');
  const analysisLoading = document.getElementById('analysis-loading');

  // Get the actual Unsplash description
  const unsplashDescription = image.dataset.description || image.alt || "Beautiful image from Unsplash";

  // Set image data
  modalImage.src = image.dataset.full;
  modalTitle.textContent = image.dataset.description || "Beautiful Image";
  modalResolution.textContent = `${image.dataset.width} x ${image.dataset.height}`;
  modalAspect.textContent = calculateAspectRatio(image.dataset.width, image.dataset.height);

  // Show modal
  imageModal.classList.add('active');
  document.body.classList.add('modal-open');

  // Start AI analysis with Unsplash description
  await performAIAnalysisWithDescription(image.src, analysisContent, analysisLoading, unsplashDescription);
}

// Update the displayEnhancedAnalysis function to show both descriptions
function displayEnhancedAnalysis(analysis, container) {
  // Build color palette HTML
  let colorPaletteHTML = '';
  if (analysis.colorPalette && Array.isArray(analysis.colorPalette) && analysis.colorPalette.length > 0) {
    colorPaletteHTML = analysis.colorPalette.map(color => `
      <div class="enhanced-color-swatch"
           style="background-color: ${color.hex};"
           title="${color.hex} (${color.percentage})"
           onclick="copyColorToClipboard('${color.hex}')">
        <div class="color-info">
          <div class="color-hex">${color.hex}</div>
          <div class="color-percent">${color.percentage}</div>
        </div>
      </div>
    `).join('');
  } else {
    colorPaletteHTML = `<div class="color-error">No colors could be extracted from this image.</div>`;
  }
}

async function analyzeImageColors(imageUrl, colorCount = 6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize image for better performance and color sampling
      const maxSize = 200;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample colors more intelligently - skip very dark/light pixels
      const colorMap = {};
      let totalPixels = 0;
      const skipStep = 4; // Sample every 4th pixel for performance

      for (let i = 0; i < data.length; i += 4 * skipStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Skip very dark pixels (shadows, blacks)
        const brightness = (r + g + b) / 3;
        if (brightness < 30) continue;

        // Skip very light pixels (overexposed whites)
        if (brightness > 240) continue;

        // Group similar colors together (reduce precision)
        const groupedR = Math.floor(r / 25) * 25;
        const groupedG = Math.floor(g / 25) * 25;
        const groupedB = Math.floor(b / 25) * 25;

        const hex = rgbToHex(groupedR, groupedG, groupedB);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
        totalPixels++;
      }

      // Filter out colors that appear less than 2% of the time
      const minThreshold = totalPixels * 0.02;
      const filteredColors = Object.entries(colorMap)
        .filter(([hex, count]) => count >= minThreshold)
        .sort((a, b) => b[1] - a[1])
        .slice(0, colorCount);

      // Format result
      const result = filteredColors.map(([hex, count]) => ({
        hex,
        percentage: ((count / totalPixels) * 100).toFixed(1) + '%'
      }));

      console.log('🎨 Extracted colors:', result);
      resolve(result);
    };

    img.onerror = function () {
      reject(new Error('Failed to load image or CORS error.'));
    };

    img.src = imageUrl;
  });
}

// Helper: Convert RGB to HEX (updated for better accuracy)
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// Helper: Convert RGB to HEX
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Copy color hex code to clipboard
async function copyColorToClipboard(hexColor) {
  try {
    await navigator.clipboard.writeText(hexColor);

    // Show success feedback
    showColorCopyFeedback(hexColor);

    // Add to chat if open
    if (aiChatPanel.classList.contains("active")) {
      addAIMessage(`I've copied the color ${hexColor} to your clipboard!`);
    }
  } catch (error) {
    console.error('Failed to copy color:', error);

    // Fallback: create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = hexColor;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    showColorCopyFeedback(hexColor);
  }
}

// Show visual feedback when color is copied
function showColorCopyFeedback(hexColor) {
  // Create temporary feedback element
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${hexColor};
    color: ${getContrastColor(hexColor)};
    padding: 12px 20px;
    border-radius: 25px;
    font-weight: 600;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: colorCopyPulse 0.6s ease-out;
  `;
  feedback.textContent = `${hexColor} copied!`;

  // Add animation keyframes if not already added
  if (!document.querySelector('#colorCopyAnimation')) {
    const style = document.createElement('style');
    style.id = 'colorCopyAnimation';
    style.textContent = `
      @keyframes colorCopyPulse {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(feedback);

  // Remove after animation
  setTimeout(() => {
    feedback.remove();
  }, 1500);
}

// Get contrasting text color for background
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Search by tag when clicked
function searchByTag(tag) {
  searchBox.value = tag;
  page = 1;
  searchImages();

  // Close modal if open
  if (imageModal.classList.contains('active')) {
    closeImageModal();
  }

  // Add to chat if open
  if (aiChatPanel.classList.contains("active")) {
    addAIMessage(`Searching for images related to "${tag}".`);
  }
}

// Enhanced color generation with better variety
function generateRandomColor() {
  // Generate colors with better saturation/brightness
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 50) + 50; // 50-100%
  const lightness = Math.floor(Math.random() * 40) + 30;  // 30-70%

  // Convert HSL to hex
  return hslToHex(hue, saturation, lightness);
}

// Convert HSL to hex color
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ...existing code...

// Close image modal
function closeImageModal() {
  imageModal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

// Generate random color
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Generate random AI labels for images
function generateRandomAILabels() {
  const labels = [
    "Portrait", "Landscape", "Abstract", "Architecture", "Nature",
    "Urban", "Wildlife", "Macro", "Street", "Minimal", "Vintage",
    "Conceptual", "Documentary", "Fine Art", "Black and White"
  ];

  const confidences = [
    "99.8%", "98.2%", "97.1%", "95.6%", "94.3%", "93.7%", "92.2%", "91.5%"
  ];

  // Select 2-3 random labels
  const numLabels = Math.floor(Math.random() * 2) + 2;
  const selectedLabels = [];

  for (let i = 0; i < numLabels; i++) {
    const randomIndex = Math.floor(Math.random() * labels.length);
    selectedLabels.push({
      name: labels[randomIndex],
      confidence: confidences[Math.floor(Math.random() * confidences.length)]
    });
    // Remove the selected label to avoid duplicates
    labels.splice(randomIndex, 1);
  }

  return JSON.stringify(selectedLabels);
}

// Animate metrics on page load
function animateMetrics() {
  const metricProgress = document.querySelectorAll('.metric-progress');
  metricProgress.forEach((circle, index) => {
    const offset = circle.getAttribute('stroke-dashoffset');

    // Animate from full circle to the target offset
    circle.style.strokeDashoffset = "339.29";
    setTimeout(() => {
      circle.style.transition = "stroke-dashoffset 1.5s ease-in-out";
      circle.style.strokeDashoffset = offset || "0";
    }, 300 + (index * 200));
  });
}

// Initialize neural network visualization
function initNeuralNetwork() {
  const neuralNetwork = document.getElementById('neural-network');
  if (!neuralNetwork) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Create nodes and connections
  const numNodes = Math.floor(width * height / 20000); // Adjust density
  const nodes = [];

  for (let i = 0; i < numNodes; i++) {
    const node = document.createElement('div');
    node.classList.add('neural-node');
    node.style.left = `${Math.random() * 100}%`;
    node.style.top = `${Math.random() * 100}%`;
    node.style.animationDelay = `${Math.random() * 5}s`;
    node.style.animationDuration = `${3 + Math.random() * 7}s`;

    neuralNetwork.appendChild(node);
    nodes.push(node);

    // Create connections between some nodes
    if (i > 0 && Math.random() > 0.7) {
      const connectionCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * i);
        const connection = document.createElement('div');
        connection.classList.add('neural-connection');

        // Position and rotate connection
        const x1 = parseFloat(node.style.left);
        const y1 = parseFloat(node.style.top);
        const x2 = parseFloat(nodes[targetIndex].style.left);
        const y2 = parseFloat(nodes[targetIndex].style.top);

        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        connection.style.width = `${distance}%`;
        connection.style.left = `${x1}%`;
        connection.style.top = `${y1}%`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = 'left center';
        connection.style.opacity = Math.random() * 0.2 + 0.1;
        connection.style.animationDelay = `${Math.random() * 5}s`;
        connection.style.animationDuration = `${1 + Math.random() * 3}s`;

        neuralNetwork.appendChild(connection);
      }
    }
  }
}

// Initialize particles
function initParticles() {
  const particles = document.getElementById('particles');
  if (!particles) return;

  const numParticles = 30;

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Random size
    const size = Math.random() * 8 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    // Random animation
    particle.style.animationDuration = `${10 + Math.random() * 20}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;

    particles.appendChild(particle);
  }
}

async function fetchCategories() {
  try {
    // Fetch topics from Unsplash API
    const response = await fetch(`https://api.unsplash.com/topics?client_id=${accessKey}&per_page=5`);
    const data = await response.json();

    // Map the API response to our category format
    currentCategories = data.map(topic => ({
      name: topic.slug,
      icon: getTopicIcon(topic.slug), // Helper function to get emoji
      label: topic.title
    }));

    // Update the UI
    renderCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

// Helper function to map topics to emojis
function getTopicIcon(topic) {
  const iconMap = {
    // Nature & Environment
    nature: '🌿', forest: '🌳', landscape: '🏞️', wildlife: '🦁', ocean: '🌊',
    mountain: '⛰️', beach: '🏖️', sunset: '🌅', flower: '🌸', garden: '🌺',

    // Architecture & Places
    architecture: '🏙️', building: '🏢', city: '🌆', monument: '🗽', interior: '🏰',
    house: '🏠', bridge: '🌉', street: '🛣️', park: '🌳', museum: '🏛️',

    // People & Lifestyle
    people: '👥', portrait: '👤', family: '👨‍👩‍👧‍👦', fashion: '👗', lifestyle: '🌟',
    sports: '⚽', fitness: '💪', dance: '💃', yoga: '🧘', wedding: '💒',

    // Technology & Science
    technology: '💻', computer: '🖥️', mobile: '📱', robot: '🤖', space: '🌌',
    science: '🔬', innovation: '💡', data: '📊', network: '🌐', digital: '⌨️',

    // Art & Entertainment
    art: '🎨', music: '🎵', film: '🎬', photography: '📸', design: '✏️',
    painting: '🖼️', theater: '🎭', concert: '🎤', book: '📚', game: '🎮',

    // Food & Drink
    food: '🍳', drink: '🥤', restaurant: '🍽️', cooking: '👨‍🍳', coffee: '☕',
    dessert: '🍰', fruit: '🍎', vegetable: '🥦', wine: '🍷', cocktail: '🍸',

    // Business & Work
    business: '💼', office: '🏢', meeting: '👥', startup: '🚀', finance: '💰',
    chart: '📈', success: '🏆', growth: '📊', teamwork: '🤝', creative: '💡',

    // Travel & Transport
    travel: '✈️', adventure: '🗺️', vacation: '🌴', hotel: '🏨', camping: '⛺',
    car: '🚗', train: '🚂', bike: '🚲', boat: '⛵', map: '🗺️',

    // Abstract & Concepts
    minimal: '⬜', pattern: '🔷', texture: '📱', concept: '💭', idea: '💡',
    modern: '🔲', vintage: '📷', classic: '🏛️', abstract: '🎨', geometric: '📐'
  };

  // Multiple default icons for better variety
  const defaultIcons = ['📸', '🎆', '🖼️', '📷', '🌄', '✨', '🎨', '📱'];

  // Return mapped icon or random default
  return iconMap[topic.toLowerCase()] ||
    defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
}



// Add this function to render categories
function renderCategories() {
  const categoryContainer = document.querySelector('.category-pills');
  if (!categoryContainer) return;

  categoryContainer.innerHTML = currentCategories
    .map(cat => `
      <button class="category-pill" data-category="${cat.name}">
        <span class="category-icon">${cat.icon}</span>${cat.label}
      </button>
    `).join('');

  // Add click handlers
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      searchBox.value = pill.dataset.category;
      page = 1;
      searchImages();
    });
  });
}

// Enhanced animateMetrics function
function animateMetrics() {
  const metricCards = document.querySelectorAll('.metric-card');
  const metricProgress = document.querySelectorAll('.metric-progress');

  // Animate metrics with delay
  metricProgress.forEach((circle, index) => {
    const offset = circle.getAttribute('stroke-dashoffset');

    // Start with full circle
    circle.style.strokeDashoffset = "339.29";

    // Animate with staggered delay
    setTimeout(() => {
      circle.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)";
      circle.style.strokeDashoffset = offset || "0";

      // Also animate the value with counting effect
      const valueEl = metricCards[index].querySelector('.metric-value');
      const finalValue = valueEl.textContent;

      // Handle different formats (numbers, percentages, or text with units)
      if (finalValue.includes('%')) {
        animateCounterPercent(valueEl, parseFloat(finalValue));
      } else if (finalValue.includes('s')) {
        animateCounterSeconds(valueEl, parseFloat(finalValue));
      } else if (finalValue.includes('M+')) {
        animateCounterMillions(valueEl, parseInt(finalValue));
      } else {
        // Generic number counter
        animateCounter(valueEl, parseInt(finalValue));
      }
    }, 300 + (index * 300));
  });

  // Add intersection observer for re-animation when scrolled into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        metricProgress.forEach((circle, index) => {
          const offset = circle.getAttribute('stroke-dashoffset');

          // Reset and animate again
          circle.style.transition = "none";
          circle.style.strokeDashoffset = "339.29";

          setTimeout(() => {
            circle.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)";
            circle.style.strokeDashoffset = offset || "0";
          }, 50);
        });
      }
    });
  }, { threshold: 0.2 });

  // Observe the metrics section
  const metricsSection = document.querySelector('.ai-metrics');
  if (metricsSection) observer.observe(metricsSection);
}

// Helper functions for counter animations
function animateCounterPercent(element, target) {
  let start = 0;
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const value = progress * target;

    element.textContent = value.toFixed(1) + '%';

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function animateCounterSeconds(element, target) {
  let start = 1.0;
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const value = start - (progress * (start - target));

    element.textContent = value.toFixed(1) + 's';

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function animateCounterMillions(element, target) {
  let start = 0;
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const value = Math.floor(progress * target);

    element.textContent = value + 'M+';

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Add this function to your script.js file

// Calculate aspect ratio from width and height
function calculateAspectRatio(width, height) {
  // Convert to numbers
  width = parseInt(width);
  height = parseInt(height);

  // Find the greatest common divisor (GCD) using Euclidean algorithm
  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  // Calculate the GCD to simplify the ratio
  const divisor = gcd(width, height);

  // Calculate simplified ratio
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  // Return as string in format "16:9"
  return `${ratioWidth}:${ratioHeight}`;
}

// Initialize the app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);