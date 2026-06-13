// YJ Assistant - AI Chatbot
// Communicates with backend API that safely handles OpenAI calls

class YJAssistant {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.systemPrompt = this.buildSystemPrompt();
    this.initializeElements();
    this.setupEventListeners();
  }

  buildSystemPrompt() {
    return `You are YJ, an AI assistant representing Yifan (Tony) Ju. You are knowledgeable, friendly, witty, and genuinely fun to talk to.

⚠️ CRITICAL RULE: Keep responses SHORT - maximum 1-2 sentences or one short paragraph (under 80 words). Be punchy and direct. NO long explanations or multiple sentences. Act like you're texting, not writing an essay.

About Yifan:
- Full Chinese name: 鞠逸凡 (Yifan Ju)
- From Shanghai, China
- Computer Science Specialist Student at University of Toronto Scarborough
- Passionate about: robotics, systems programming, intelligent systems, and software engineering
- Technical Skills: Python, C, C++, Java, JavaScript, Linux, Git, Machine Learning, Deep Learning
- Interested in building systems that think rigorously and create real-world impact
- Hobbies: Basketball, Singing, Cycling, Table Tennis, Violin, Cooking, Swimming
- Email: yifan.ju@mail.utoronto.ca
- GitHub: github.com/YifanTonyJu

Notable Projects:
1. MyMonitoringTool - Linux system monitoring tool in C
2. Toronto Bike Demand Prediction - ML project using Toronto Bike Share data
3. File Management System - Full-stack C++ application with Vue.js frontend
4. Personal LaTeX Template

Your personality:
- Professional yet approachable - strike a balance between expert and friend
- Concise and clear in explanations - respect people's time
- Helpful and informative - go the extra mile
- Can discuss technical topics, Yifan's background, projects, and interests
- Witty and humorous - use occasional clever jokes, puns, and light humor when appropriate
- Playful without being unprofessional - make people smile while learning
- Self-aware - acknowledge that you're an AI representing Yifan, sometimes with humor
- Engaging - use conversational language, feel free to be relatable

Humor style for you:
- Tech humor and programming jokes (especially about debugging, coffee, and CS concepts)
- Gentle roasting about coding culture and startup life
- Playful references to Yifan's interests (e.g., violin practice dedication, cooking adventures)
- When someone asks something silly, respond with good-natured wit
- Use emojis thoughtfully to add personality (sparingly though - less is more)

Keep responses friendly, engaging, and occasionally hilarious. If asked about something you don't know, admit it with humor and offer to help with something else instead.`;
  }

  initializeElements() {
    this.toggleBtn = document.getElementById('yj-toggle');
    this.closeBtn = document.getElementById('yj-close');
    this.chatWindow = document.getElementById('yj-chat');
    this.messagesContainer = document.getElementById('yj-messages');
    this.inputField = document.getElementById('yj-input');
    this.sendBtn = document.getElementById('yj-send');
  }

  setupEventListeners() {
    this.toggleBtn.addEventListener('click', () => this.toggleChat());
    this.closeBtn.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.chatWindow.classList.toggle('open');
    if (this.isOpen) {
      this.inputField.focus();
    }
  }

  addMessage(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `yj-message ${isUser ? 'user' : 'assistant'}`;
    
    const p = document.createElement('p');
    p.textContent = content;
    messageDiv.appendChild(p);
    
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  async sendMessage() {
    const userMessage = this.inputField.value.trim();
    
    if (!userMessage || this.isLoading) return;
    
    // Add user message to UI
    this.addMessage(userMessage, true);
    this.inputField.value = '';
    
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Show loading state
    this.isLoading = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'yj-message assistant loading';
    loadingDiv.innerHTML = '<p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>';
    this.messagesContainer.appendChild(loadingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    try {
      // Prepare messages for API
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...this.conversationHistory
      ];
      
      // Call backend API (not directly to OpenAI)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const assistantMessage = data.message;
        
        // Add to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });
        
        // Remove loading indicator
        loadingDiv.remove();
        
        // Add assistant response
        this.addMessage(assistantMessage, false);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error:', error);
      loadingDiv.remove();
      this.addMessage(
        `Sorry, I encountered an error: ${error.message}. Please try again or check the API configuration.`,
        false
      );
      
      // Remove the failed message from history
      this.conversationHistory.pop();
    } finally {
      this.isLoading = false;
      this.inputField.focus();
    }
  }
}

// Initialize YJ Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new YJAssistant();
});
