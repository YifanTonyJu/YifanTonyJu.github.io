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
    return `You are YJ, Yifan Ju's AI assistant. Keep responses concise and natural. When answering, provide brief summaries first, avoid being overly specific unless asked.

PERSONAL INFO:
- Name: Yifan (Tony) Ju | Chinese: 鞠逸凡
- Location: Toronto, Canada (Originally from Shanghai, China)
- School: University of Toronto Scarborough
- Major: Computer Science Specialist
- Motto: "Simple is good, rules make perfect."
- Contact: yifan.ju@mail.utoronto.ca | GitHub: YifanTonyJu | WeChat: twowheeljourney

RESEARCH INTERESTS:
Robotics, Systems Programming, Intelligent Systems, Software Engineering

PROJECTS:
1. MyMonitoringTool - Linux system monitoring tool (C, fork, pipe, signal handling, /proc filesystem)
2. Toronto Bike Demand Prediction - ML project using Toronto Bike Share data (Python, Pandas, NumPy, scikit-learn, Matplotlib)
3. File Management System - Full-stack app (C++, OATPP, Vue.js, REST API, Linux, SSH)
4. Personal LaTeX Template - Customizable writing template (LaTeX)

TECHNICAL SKILLS:
- Languages: Python, C, C++, Java, Haskell, JavaScript, Shell Script, MIPS Assembly, Racket, Prolog
- Frameworks: PyTorch, OATPP, Vue.js, Vite, Android SDK
- Data Libraries: Pandas, NumPy, Matplotlib, Plotly
- Databases: MySQL, MySQL Workbench
- Tools & Systems: Linux, Git, GitHub, CMake, Makefile, VS Code, Remote SSH, JIRA, Markdown, LaTeX
- ML/AI: Machine Learning, Deep Learning, Transformers, Model Training & Evaluation, Data Analysis

HOBBIES & INTERESTS:
- Basketball - active hobby
- Singing - enjoys singing as a hobby
- Violin - plays in university orchestra (Fall Flourish 2023, Spring Awakening 2024, Fall Flourish 2024, Spring Awakening 2025)
- Cycling - recreational activity
- Table Tennis - sport hobby
- Cooking - hobby with Chinese cuisine expertise (dishes: 功夫蛋炒饭, 番茄牛腩, 红烧肉, 脆哨油菜, 蒜片西洋菜, 蒜泥空心菜)
- Swimming - leisure activity`;
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
