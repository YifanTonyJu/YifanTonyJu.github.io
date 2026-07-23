// Pony Assistant - AI Chatbot
// Communicates with backend API that safely handles OpenAI calls

class PonyAssistant {
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
    return `You are Pony, an AI assistant created by Yifan Ju. You are NOT Yifan Ju yourself - you are his AI assistant. You are helpful, concise, and natural in your responses. You provide information about Yifan and assist with queries. 

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

BOOKING A MEETING:
- If someone wants to talk with Yifan face-to-face or have a live/video conversation, let them know they can book a meeting with him.
- Share this booking link so they can schedule directly: https://www.yifantonyju.com/contact
- There is also a "Book a Meeting" card in the Contact section at the bottom of this website, which lets visitors schedule a video call (powered by Cal.com). They can pick a duration (15, 40, or 60 minutes) and click "Schedule a Time".
- When providing the link, format it as a clickable Markdown link, e.g. [book a meeting](https://www.yifantonyju.com/contact).
- Encourage this when a user expresses interest in meeting, chatting directly, discussing collaboration, or connecting in person.

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
    this.toggleBtn = document.getElementById('pony-toggle');
    this.closeBtn = document.getElementById('pony-close');
    this.chatWindow = document.getElementById('pony-chat');
    this.messagesContainer = document.getElementById('pony-messages');
    this.inputField = document.getElementById('pony-input');
    this.sendBtn = document.getElementById('pony-send');
    this.voiceBtn = document.getElementById('pony-voice');
    this.transcribingIndicator = null; // Reference to transcribing indicator element
  }

  // Initialize audio recording using MediaRecorder API
  initializeAudioRecording() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioContext = null;
    this.analyser = null;
    this.animationFrameId = null;
    this.transcribingBars = null;

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
    messageDiv.className = `pony-message ${isUser ? 'user' : 'assistant'}`;

    // Convert markdown to rich HTML for assistant messages (block-level content
    // like lists/code blocks requires a <div>, not a <p>). User messages stay
    // plain text inside a <p>.
    if (!isUser) {
      const bubble = document.createElement('div');
      bubble.className = 'markdown-body pony-markdown';
      bubble.innerHTML = this.parseMarkdown(content);
      messageDiv.appendChild(bubble);

      // Copy button (ChatGPT-style): copies the original markdown source.
      const copyBtn = document.createElement('button');
      copyBtn.className = 'pony-copy-btn';
      copyBtn.type = 'button';
      copyBtn.title = 'Copy markdown';
      copyBtn.setAttribute('aria-label', 'Copy markdown');
      copyBtn.innerHTML = this.getCopyIcon();
      copyBtn.addEventListener('click', () => this.copyMessage(content, copyBtn));
      messageDiv.appendChild(copyBtn);
    } else {
      const p = document.createElement('p');
      p.textContent = content;
      messageDiv.appendChild(p);
    }

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  // SVG icons for the copy button (clipboard / check).
  getCopyIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  }

  getCheckIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  }

  // Copy the raw markdown source of a message to the clipboard.
  async copyMessage(markdown, btn) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        // Fallback for insecure contexts / older browsers.
        const ta = document.createElement('textarea');
        ta.value = markdown;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.classList.add('copied');
      btn.innerHTML = this.getCheckIcon();
      btn.title = 'Copied!';
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = this.getCopyIcon();
        btn.title = 'Copy markdown';
      }, 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  // Parse markdown to safe HTML. Uses the `marked` library (ChatGPT-style
  // rendering) with DOMPurify sanitization when available, and falls back to a
  // lightweight built-in parser if the CDN libraries failed to load.
  parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
      const rawHtml = marked.parse(text, {
        gfm: true,        // GitHub-flavored markdown (tables, strikethrough, ...)
        breaks: true,     // treat single newlines as <br>
        headerIds: false,
        mangle: false
      });
      // Sanitize to prevent XSS from model output.
      if (typeof DOMPurify !== 'undefined') {
        const clean = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target', 'rel'] });
        // Make links open in a new tab safely.
        const wrapper = document.createElement('div');
        wrapper.innerHTML = clean;
        wrapper.querySelectorAll('a[href]').forEach((a) => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });
        return wrapper.innerHTML;
      }
      return rawHtml;
    }
    return this.parseMarkdownFallback(text);
  }

  // Minimal fallback parser (only used if marked.js is unavailable).
  parseMarkdownFallback(text) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');
    text = text.replace(/`([^`]*)`/g, '<code>$1</code>');
    text = text.replace(/\n\n/g, '<br><br>');
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>[\s\S]*?<\/li>)/, '<ul>$1</ul>');
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

      // Clean up any previous transcribing indicator
      if (this.transcribingIndicator) {
        this.transcribingIndicator.remove();
        this.transcribingIndicator = null;
      }

      // Update UI - hide input field and show transcribing indicator
      this.voiceBtn.classList.add('listening');
      this.inputField.style.display = 'none';
      
      const transcribingDiv = document.createElement('div');
      transcribingDiv.className = 'pony-transcribing-overlay';
      transcribingDiv.innerHTML = '<div class="pony-transcribing"><div class="pony-transcribing-bar"></div><div class="pony-transcribing-bar"></div><div class="pony-transcribing-bar"></div><div class="pony-transcribing-bar"></div><div class="pony-transcribing-bar"></div></div>';
      this.inputField.parentNode.insertBefore(transcribingDiv, this.inputField);
      this.transcribingIndicator = transcribingDiv;
      this.transcribingBars = transcribingDiv.querySelectorAll('.pony-transcribing-bar');

      // Setup Web Audio API for real-time frequency analysis
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Start analyzing audio frequencies
      this.analyzeAudioFrequencies();

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        this.voiceBtn.classList.remove('listening');
        
        // Stop frequency analysis
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Send to backend for transcription (indicator already shown)
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
      
      // Clean up if there was an error
      if (this.transcribingIndicator) {
        this.transcribingIndicator.remove();
        this.transcribingIndicator = null;
      }
      this.inputField.style.display = 'block';
    }
  }

  // Analyze audio frequencies and update wave heights
  analyzeAudioFrequencies() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average frequency for overall volume level
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    // Determine if there's significant audio (threshold = 20)
    const hasSound = average > 20;

    // Update each bar height based on frequency data
    if (this.transcribingBars) {
      this.transcribingBars.forEach((bar, index) => {
        if (hasSound) {
          // With sound: use overall volume with variation per bar
          // Sample different parts of the frequency spectrum for variety
          const sampleStep = Math.floor(dataArray.length / this.transcribingBars.length);
          const sampleIndex = index * sampleStep;
          const sampleValue = dataArray[sampleIndex] || average;
          
          // Combine overall average with specific frequency sample for better distribution
          const blendedValue = (average * 0.6 + sampleValue * 0.4);
          const height = Math.max(4, Math.min(28, (blendedValue / 255) * 28)); // Min 4px, max 28px
          bar.style.height = height + 'px';
        } else {
          // Without sound: flat dotted line (no animation, just static bars)
          bar.style.height = '8px';
        }
      });
    }

    this.animationFrameId = requestAnimationFrame(() => this.analyzeAudioFrequencies());
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
        
        // Indicator already shown from startRecording, just keep it during transcription

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
            // Remove transcribing indicator and show input field
            if (this.transcribingIndicator) {
              this.transcribingIndicator.remove();
              this.transcribingIndicator = null;
            }
            this.inputField.style.display = 'block';
            
            // Append transcribed text to existing input (without space)
            this.inputField.value += data.text;
            this.inputField.focus();
          } else {
            if (this.transcribingIndicator) {
              this.transcribingIndicator.remove();
              this.transcribingIndicator = null;
            }
            this.inputField.style.display = 'block';
            console.error('Transcription failed: No text received', data);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          if (this.transcribingIndicator) {
            this.transcribingIndicator.remove();
            this.transcribingIndicator = null;
          }
          this.inputField.style.display = 'block';
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error preparing audio:', error);
      if (this.transcribingIndicator) {
        this.transcribingIndicator.remove();
        this.transcribingIndicator = null;
      }
      this.inputField.style.display = 'block';
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
    loadingDiv.className = 'pony-message assistant loading';
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

// Initialize Pony Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PonyAssistant();
});
