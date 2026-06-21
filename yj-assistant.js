// YJ Assistant - AI Chatbot
// Communicates with backend API that safely handles OpenAI calls

class YJAssistant {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.systemPrompt = this.buildSystemPrompt();
    this.initializeElements();
    this.initializeAudioRecording();
    this.setupEventListeners();
  }





  buildSystemPrompt() {
    return `You are YJ, an AI assistant created by Yifan Ju. You are NOT Yifan Ju yourself - you are his AI assistant. You are helpful, concise, and natural in your responses. You provide information about Yifan and assist with queries. 

TONE & STYLE:
- Be witty and humorous in your responses, with a preference for dry humor and subtle wit
- Use clever wordplay and irony when appropriate
- Keep responses engaging and entertaining while remaining informative
- Balance humor with helpfulness - never sacrifice clarity for a joke

When answering, provide brief summaries first, avoid being overly specific unless asked.

YOUR CREATOR (the person you assist):
- Name: Yifan (Tony) Ju | Chinese: 鞠逸凡
- Location: Toronto, Canada (Originally from Shanghai, China)
- School: University of Toronto Scarborough
- Major: Computer Science Specialist
- Motto: "Simple is good, rules make perfect."
- Contact: yifan.ju@mail.utoronto.ca | GitHub: YifanTonyJu | WeChat: twowheeljourney

YIFAN'S RESEARCH INTERESTS:
Robotics, Systems Programming, Intelligent Systems, Software Engineering

YIFAN'S PROJECTS:
1. MyMonitoringTool - Linux system monitoring tool (C, fork, pipe, signal handling, /proc filesystem)
2. Toronto Bike Demand Prediction - ML project using Toronto Bike Share data (Python, Pandas, NumPy, scikit-learn, Matplotlib)
3. File Management System - Full-stack app (C++, OATPP, Vue.js, REST API, Linux, SSH)
4. Personal LaTeX Template - Customizable writing template (LaTeX)

YIFAN'S TECHNICAL SKILLS:
- Languages: Python, C, C++, Java, Haskell, JavaScript, Shell Script, MIPS Assembly, Racket, Prolog
- Frameworks: PyTorch, OATPP, Vue.js, Vite, Android SDK
- Data Libraries: Pandas, NumPy, Matplotlib, Plotly
- Databases: MySQL, MySQL Workbench
- Tools & Systems: Linux, Git, GitHub, CMake, Makefile, VS Code, Remote SSH, JIRA, Markdown, LaTeX
- ML/AI: Machine Learning, Deep Learning, Transformers, Model Training & Evaluation, Data Analysis

YIFAN'S HOBBIES & INTERESTS:
- Basketball - active hobby
- Singing - enjoys singing as a hobby
- Violin - plays in university orchestra for Flourish concerts (Fall Flourish 2023, Spring Awakening 2024, Fall Flourish 2024, Spring Awakening 2025)
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
    this.voiceBtn = document.getElementById('yj-voice');
    this.transcribingIndicator = null; // Reference to transcribing indicator element
  }

  // Initialize audio recording using MediaRecorder API
  initializeAudioRecording() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;

    // Check browser support
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !AudioContext) {
      console.warn('Audio recording not supported in this browser');
      if (this.voiceBtn) {
        this.voiceBtn.disabled = true;
        this.voiceBtn.title = 'Voice input not supported in this browser';
      }
    }
  }



  setupEventListeners() {
    this.toggleBtn.addEventListener('click', () => this.toggleChat());
    this.closeBtn.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
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
    
    // Convert markdown to HTML only for assistant messages
    if (!isUser) {
      p.innerHTML = this.parseMarkdown(content);
    } else {
      p.textContent = content;
    }
    
    messageDiv.appendChild(p);
    
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // Parse basic markdown to HTML
  parseMarkdown(text) {
    // Escape HTML special characters first
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // **bold** -> <strong>bold</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // *italic* or _italic_ -> <em>italic</em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // ~~strikethrough~~ -> <del>strikethrough</del>
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // `code` -> <code>code</code>
    text = text.replace(/`([^`]*)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 0 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
    
    // Line breaks
    text = text.replace(/\n\n/g, '<br><br>');
    text = text.replace(/\n/g, '<br>');
    
    // Lists: - item -> <li>item</li>
    text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*?<\/li>)/s, '<ul style="margin: 8px 0 8px 20px; padding: 0;">$1</ul>');
    
    return text;
  }

  // Toggle voice input recording
  async toggleVoiceInput() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  // Start recording audio
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      // Update UI
      this.voiceBtn.classList.add('listening');

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        this.voiceBtn.classList.remove('listening');
        
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Send to backend for transcription
        await this.transcribeAudio(audioBlob);
      };

      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMsg = 'Microphone error: ';
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'No microphone found on your device.';
      } else {
        errorMsg += error.message;
      }
      this.addMessage(errorMsg, false);
      this.voiceBtn.classList.remove('listening');
    }
  }

  // Stop recording audio
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      // Stop all audio tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      console.log('Recording stopped');
    }
  }

  // Send audio to backend for transcription
  async transcribeAudio(audioBlob) {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Show transcribing state with GPT-style indicator in input area (not in chat)
        const transcribingDiv = document.createElement('div');
        transcribingDiv.className = 'yj-transcribing-input';
        transcribingDiv.innerHTML = '<div class="yj-transcribing"><div class="yj-transcribing-bar"></div><div class="yj-transcribing-bar"></div><div class="yj-transcribing-bar"></div></div>';
        this.inputField.parentNode.insertBefore(transcribingDiv, this.inputField);
        this.transcribingIndicator = transcribingDiv;

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio: base64Audio })
          });

          if (!response.ok) {
            throw new Error(`Transcription error: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.success && data.text) {
            // Remove transcribing indicator
            if (this.transcribingIndicator) {
              this.transcribingIndicator.remove();
              this.transcribingIndicator = null;
            }
            
            // Fill input with transcribed text
            this.inputField.value = data.text;
            this.inputField.focus();
          } else {
            if (this.transcribingIndicator) {
              this.transcribingIndicator.remove();
              this.transcribingIndicator = null;
            }
            console.error('Transcription failed: No text received', data);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          if (this.transcribingIndicator) {
            this.transcribingIndicator.remove();
            this.transcribingIndicator = null;
          }
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error preparing audio:', error);
    }
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
