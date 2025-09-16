// AgentShield Chrome Extension - Content Script
class AgentShieldContentScript {
  constructor() {
    this.init();
  }

  init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('AgentShield content script loaded');
    
    // Detect LLM platform and inject scan button
    this.detectAndInject();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Monitor for new chat elements (for dynamic content)
    this.observeChatElements();
  }

  detectAndInject() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('openai.com')) {
      this.injectChatGPT();
    } else if (hostname.includes('claude.ai')) {
      this.injectClaude();
    } else if (hostname.includes('bard.google.com')) {
      this.injectBard();
    } else {
      this.injectGeneric();
    }
  }

  injectChatGPT() {
    const textarea = document.querySelector('textarea[placeholder*="Message"]');
    if (textarea) {
      this.createScanButton(textarea, 'ChatGPT');
    }
  }

  injectClaude() {
    const textarea = document.querySelector('textarea[placeholder*="Talk to Claude"]');
    if (textarea) {
      this.createScanButton(textarea, 'Claude');
    }
  }

  injectBard() {
    const textarea = document.querySelector('textarea[placeholder*="Enter a prompt"]');
    if (textarea) {
      this.createScanButton(textarea, 'Bard');
    }
  }

  injectGeneric() {
    // Look for common textarea patterns
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.placeholder && 
          (textarea.placeholder.toLowerCase().includes('message') ||
           textarea.placeholder.toLowerCase().includes('prompt') ||
           textarea.placeholder.toLowerCase().includes('ask'))) {
        this.createScanButton(textarea, 'Generic LLM');
        break;
      }
    }
  }

  createScanButton(textarea, platform) {
    // Check if button already exists
    if (document.querySelector('.agentshield-scan-btn')) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'agentshield-scan-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
        <path d="M12 3v6m0 6v6"/>
      </svg>
      Scan Agent
    `;
    
    button.style.cssText = `
      position: absolute;
      top: -40px;
      right: 10px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#1565c0';
      button.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#1976d2';
      button.style.transform = 'translateY(0)';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.scanAgent(textarea, platform);
    });

    // Position relative to textarea
    const textareaContainer = textarea.closest('div') || textarea.parentElement;
    textareaContainer.style.position = 'relative';
    textareaContainer.appendChild(button);

    // Add scan button to textarea container
    this.scanButton = button;
    this.textarea = textarea;
    this.platform = platform;
  }

  async scanAgent(textarea, platform) {
    try {
      this.updateScanButton('Scanning...', true);
      
      // Get conversation context
      const context = this.extractConversationContext();
      
      // Prepare scan data
      const scanData = {
        platform: platform,
        url: window.location.href,
        context: context,
        timestamp: new Date().toISOString(),
        tests: ['prompt-injection', 'jailbreaking', 'role-confusion', 'data-exfiltration']
      };

      // Send scan request to background script
      console.log('Sending scan request:', scanData);
      const response = await chrome.runtime.sendMessage({
        action: 'scanAgent',
        data: scanData
      });

      console.log('Received response:', response);
      
      if (response && response.success) {
        this.showScanResults(response.data);
      } else {
        this.showError(response?.error || 'No response received');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      this.showError(error.message);
    } finally {
      this.updateScanButton('Scan Agent', false);
    }
  }

  extractConversationContext() {
    const context = {
      messages: [],
      metadata: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: this.platform
      }
    };

    // Extract messages based on platform
    if (this.platform === 'ChatGPT') {
      const messageElements = document.querySelectorAll('[data-message-author-role]');
      messageElements.forEach(el => {
        const role = el.getAttribute('data-message-author-role');
        const content = el.textContent?.trim();
        if (content) {
          context.messages.push({ role, content });
        }
      });
    } else if (this.platform === 'Claude') {
      const messageElements = document.querySelectorAll('.claude-message, .user-message');
      messageElements.forEach(el => {
        const role = el.classList.contains('claude-message') ? 'assistant' : 'user';
        const content = el.textContent?.trim();
        if (content) {
          context.messages.push({ role, content });
        }
      });
    } else {
      // Generic extraction
      const messageElements = document.querySelectorAll('[class*="message"], [class*="chat"]');
      messageElements.forEach(el => {
        const content = el.textContent?.trim();
        if (content && content.length > 10) {
          context.messages.push({ role: 'unknown', content });
        }
      });
    }

    return context;
  }

  updateScanButton(text, loading) {
    if (this.scanButton) {
      this.scanButton.innerHTML = loading ? 
        `<div class="spinner"></div> ${text}` : 
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
          <path d="M12 3v6m0 6v6"/>
        </svg> ${text}`;
      
      this.scanButton.disabled = loading;
    }
  }

  showScanResults(results) {
    console.log('Showing scan results:', results);
    try {
      // Create results modal
      const modal = this.createResultsModal(results);
      document.body.appendChild(modal);
      console.log('Modal added to DOM');
    } catch (error) {
      console.error('Failed to show results modal:', error);
      // Fallback: show alert
      alert(`Scan completed! Risk Score: ${results.score}/100, Severity: ${results.severity}`);
    }
  }

  createResultsModal(results) {
    const modal = document.createElement('div');
    modal.className = 'agentshield-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    const severityColor = {
      'Critical': '#f44336',
      'High': '#ff9800',
      'Medium': '#ffc107',
      'Low': '#4caf50'
    };

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1976d2;">AgentShield Scan Results</h2>
        <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="font-size: 32px; font-weight: bold; color: ${severityColor[results.results.severity]}">
            ${results.results.score}/100
          </div>
          <div>
            <div style="font-size: 18px; font-weight: 500; color: ${severityColor[results.results.severity]}">
              ${results.results.severity} Risk
            </div>
            <div style="font-size: 14px; color: #666;">
              ${results.results.summary}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">Test Results</h3>
        ${results.results.tests.map(test => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 500;">${test.name.replace(/-/g, ' ')}</div>
              <div style="font-size: 12px; color: #666;">${test.evidence}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; background: ${test.passed ? '#4caf50' : '#f44336'}">
                ${test.passed ? 'PASSED' : 'FAILED'}
              </span>
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; background: ${severityColor[test.severity]}">
                ${test.severity}
              </span>
            </div>
          </div>
        `).join('')}
      </div>

      ${results.results.remediation.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">Remediation Suggestions</h3>
          ${results.results.remediation.map(rem => `
            <div style="padding: 12px; border-left: 4px solid #1976d2; background: #f5f5f5; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
              <div style="font-weight: 500; margin-bottom: 4px;">${rem.title}</div>
              <div style="font-size: 14px; color: #666;">${rem.description}</div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">Priority: ${rem.priority} | Effort: ${rem.estimatedEffort}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="export-btn" style="padding: 8px 16px; border: 1px solid #1976d2; background: white; color: #1976d2; border-radius: 6px; cursor: pointer;">
          Export JSON
        </button>
        <button class="close-modal-btn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    modal.appendChild(modalContent);

    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    modal.querySelector('.export-btn').addEventListener('click', () => {
      this.exportResults(results);
    });

    return modal;
  }

  showError(error) {
    const modal = document.createElement('div');
    modal.className = 'agentshield-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; text-align: center;">
        <h2 style="color: #f44336; margin: 0 0 16px 0;">Scan Failed</h2>
        <p style="margin: 0 0 20px 0; color: #666;">${error}</p>
        <button style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('button').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  exportResults(results) {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agentshield-scan-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  observeChatElements() {
    // Watch for new chat elements being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const textareas = node.querySelectorAll ? node.querySelectorAll('textarea') : [];
            textareas.forEach(textarea => {
              if (textarea.placeholder && 
                  (textarea.placeholder.toLowerCase().includes('message') ||
                   textarea.placeholder.toLowerCase().includes('prompt'))) {
                this.createScanButton(textarea, this.platform || 'Generic LLM');
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'injectScanButton':
        this.detectAndInject();
        sendResponse({ success: true });
        break;
      
      case 'runThreatTest':
        try {
          const result = await this.runThreatTest(request.data);
          sendResponse({ success: true, data: result });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
      
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  async runThreatTest(data) {
    // This would run a specific threat test
    // For now, return a mock result
    return {
      name: data.testName,
      passed: false,
      severity: 'High',
      evidence: 'Mock threat test result',
      duration: 1000,
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize content script
new AgentShieldContentScript();
