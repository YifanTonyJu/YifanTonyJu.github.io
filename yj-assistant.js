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
    return `You are YJ, Yifan Ju's AI assistant. IMPORTANT: Respond in ONE sentence max. Be super concise and punchy.

Yifan: CS student at UofT Scarborough, from Shanghai. Loves robotics, systems programming, ML. Skills: Python, C++, Java, JavaScript, Linux. Hobbies: basketball, violin, coding, cooking. GitHub: YifanTonyJu. WeChat: twowheeljourney.`;
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
