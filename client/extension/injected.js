// AgentShield Chrome Extension - Injected Script
// This script is injected into the page to add scan functionality

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.agentshieldInjected) {
    return;
  }
  window.agentshieldInjected = true;

  console.log('AgentShield injected script loaded');

  // Create scan button styles
  const style = document.createElement('style');
  style.textContent = `
    .agentshield-scan-btn {
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .agentshield-scan-btn:hover {
      background: #1565c0;
      transform: translateY(-1px);
    }
    
    .agentshield-scan-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    
    .agentshield-scan-btn .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .agentshield-modal {
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .agentshield-modal-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    
    .agentshield-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .agentshield-modal-title {
      margin: 0;
      color: #1976d2;
      font-size: 20px;
      font-weight: 600;
    }
    
    .agentshield-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
    
    .agentshield-score-display {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .agentshield-score-number {
      font-size: 32px;
      font-weight: bold;
    }
    
    .agentshield-severity-info {
      flex: 1;
    }
    
    .agentshield-severity-level {
      font-size: 18px;
      font-weight: 500;
    }
    
    .agentshield-summary {
      font-size: 14px;
      color: #666;
    }
    
    .agentshield-test-results {
      margin-bottom: 20px;
    }
    
    .agentshield-test-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .agentshield-test-info {
      flex: 1;
    }
    
    .agentshield-test-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .agentshield-test-evidence {
      font-size: 12px;
      color: #666;
    }
    
    .agentshield-test-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .agentshield-status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: white;
    }
    
    .agentshield-status-passed {
      background: #4caf50;
    }
    
    .agentshield-status-failed {
      background: #f44336;
    }
    
    .agentshield-severity-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: white;
    }
    
    .agentshield-severity-critical {
      background: #f44336;
    }
    
    .agentshield-severity-high {
      background: #ff9800;
    }
    
    .agentshield-severity-medium {
      background: #ffc107;
    }
    
    .agentshield-severity-low {
      background: #4caf50;
    }
    
    .agentshield-remediation {
      margin-bottom: 20px;
    }
    
    .agentshield-remediation-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .agentshield-remediation-item {
      padding: 12px;
      border-left: 4px solid #1976d2;
      background: #f5f5f5;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
    }
    
    .agentshield-remediation-title-item {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .agentshield-remediation-description {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .agentshield-remediation-meta {
      font-size: 12px;
      color: #999;
    }
    
    .agentshield-modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .agentshield-btn {
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .agentshield-btn-primary {
      background: #1976d2;
      color: white;
      border: none;
    }
    
    .agentshield-btn-primary:hover {
      background: #1565c0;
    }
    
    .agentshield-btn-secondary {
      background: white;
      color: #1976d2;
      border: 1px solid #1976d2;
    }
    
    .agentshield-btn-secondary:hover {
      background: #f5f5f5;
    }
  `;
  document.head.appendChild(style);

  // Function to create scan button
  function createScanButton(textarea, platform) {
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

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      scanAgent(textarea, platform);
    });

    // Position relative to textarea
    const textareaContainer = textarea.closest('div') || textarea.parentElement;
    textareaContainer.style.position = 'relative';
    textareaContainer.appendChild(button);

    return button;
  }

  // Function to scan agent
  async function scanAgent(textarea, platform) {
    const button = document.querySelector('.agentshield-scan-btn');
    if (!button) return;

    try {
      updateScanButton('Scanning...', true);
      
      // Get conversation context
      const context = extractConversationContext();
      
      // Prepare scan data
      const scanData = {
        platform: platform,
        url: window.location.href,
        context: context,
        timestamp: new Date().toISOString(),
        tests: ['prompt-injection', 'jailbreaking', 'role-confusion', 'data-exfiltration']
      };

      // Send scan request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'scanAgent',
        data: scanData
      });

      if (response.success) {
        showScanResults(response.data);
      } else {
        showError(response.error);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      showError(error.message);
    } finally {
      updateScanButton('Scan Agent', false);
    }
  }

  // Function to update scan button
  function updateScanButton(text, loading) {
    const button = document.querySelector('.agentshield-scan-btn');
    if (!button) return;

    button.innerHTML = loading ? 
      `<div class="spinner"></div> ${text}` : 
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
        <path d="M12 3v6m0 6v6"/>
      </svg> ${text}`;
    
    button.disabled = loading;
  }

  // Function to extract conversation context
  function extractConversationContext() {
    const context = {
      messages: [],
      metadata: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: detectPlatform()
      }
    };

    const platform = detectPlatform();
    
    if (platform === 'ChatGPT') {
      const messageElements = document.querySelectorAll('[data-message-author-role]');
      messageElements.forEach(el => {
        const role = el.getAttribute('data-message-author-role');
        const content = el.textContent?.trim();
        if (content) {
          context.messages.push({ role, content });
        }
      });
    } else if (platform === 'Claude') {
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

  // Function to detect platform
  function detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('openai.com')) {
      return 'ChatGPT';
    } else if (hostname.includes('claude.ai')) {
      return 'Claude';
    } else if (hostname.includes('bard.google.com')) {
      return 'Bard';
    } else {
      return 'Generic LLM';
    }
  }

  // Function to show scan results
  function showScanResults(results) {
    const modal = createResultsModal(results);
    document.body.appendChild(modal);
  }

  // Function to create results modal
  function createResultsModal(results) {
    const modal = document.createElement('div');
    modal.className = 'agentshield-modal';

    const severityColor = {
      'Critical': '#f44336',
      'High': '#ff9800',
      'Medium': '#ffc107',
      'Low': '#4caf50'
    };

    modal.innerHTML = `
      <div class="agentshield-modal-content">
        <div class="agentshield-modal-header">
          <h2 class="agentshield-modal-title">AgentShield Scan Results</h2>
          <button class="agentshield-close-btn">&times;</button>
        </div>
        
        <div class="agentshield-score-display">
          <div class="agentshield-score-number" style="color: ${severityColor[results.results.severity]}">
            ${results.results.score}/100
          </div>
          <div class="agentshield-severity-info">
            <div class="agentshield-severity-level" style="color: ${severityColor[results.results.severity]}">
              ${results.results.severity} Risk
            </div>
            <div class="agentshield-summary">
              ${results.results.summary}
            </div>
          </div>
        </div>

        <div class="agentshield-test-results">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">Test Results</h3>
          ${results.results.tests.map(test => `
            <div class="agentshield-test-item">
              <div class="agentshield-test-info">
                <div class="agentshield-test-name">${test.name.replace(/-/g, ' ')}</div>
                <div class="agentshield-test-evidence">${test.evidence}</div>
              </div>
              <div class="agentshield-test-status">
                <span class="agentshield-status-badge ${test.passed ? 'agentshield-status-passed' : 'agentshield-status-failed'}">
                  ${test.passed ? 'PASSED' : 'FAILED'}
                </span>
                <span class="agentshield-severity-badge agentshield-severity-${test.severity.toLowerCase()}">
                  ${test.severity}
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        ${results.results.remediation.length > 0 ? `
          <div class="agentshield-remediation">
            <h3 class="agentshield-remediation-title">Remediation Suggestions</h3>
            ${results.results.remediation.map(rem => `
              <div class="agentshield-remediation-item">
                <div class="agentshield-remediation-title-item">${rem.title}</div>
                <div class="agentshield-remediation-description">${rem.description}</div>
                <div class="agentshield-remediation-meta">Priority: ${rem.priority} | Effort: ${rem.estimatedEffort}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="agentshield-modal-actions">
          <button class="agentshield-btn agentshield-btn-secondary export-btn">
            Export JSON
          </button>
          <button class="agentshield-btn agentshield-btn-primary close-modal-btn">
            Close
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.agentshield-close-btn').addEventListener('click', () => {
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
      exportResults(results);
    });

    return modal;
  }

  // Function to show error
  function showError(error) {
    const modal = document.createElement('div');
    modal.className = 'agentshield-modal';
    modal.innerHTML = `
      <div class="agentshield-modal-content" style="max-width: 400px; text-align: center;">
        <h2 style="color: #f44336; margin: 0 0 16px 0;">Scan Failed</h2>
        <p style="margin: 0 0 20px 0; color: #666;">${error}</p>
        <button class="agentshield-btn agentshield-btn-primary">
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

  // Function to export results
  function exportResults(results) {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agentshield-scan-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Function to detect and inject scan button
  function detectAndInject() {
    const hostname = window.location.hostname;
    let textarea = null;
    let platform = 'Generic LLM';
    
    if (hostname.includes('openai.com')) {
      textarea = document.querySelector('textarea[placeholder*="Message"]');
      platform = 'ChatGPT';
    } else if (hostname.includes('claude.ai')) {
      textarea = document.querySelector('textarea[placeholder*="Talk to Claude"]');
      platform = 'Claude';
    } else if (hostname.includes('bard.google.com')) {
      textarea = document.querySelector('textarea[placeholder*="Enter a prompt"]');
      platform = 'Bard';
    } else {
      // Look for common textarea patterns
      const textareas = document.querySelectorAll('textarea');
      for (const ta of textareas) {
        if (ta.placeholder && 
            (ta.placeholder.toLowerCase().includes('message') ||
             ta.placeholder.toLowerCase().includes('prompt') ||
             ta.placeholder.toLowerCase().includes('ask'))) {
          textarea = ta;
          break;
        }
      }
    }

    if (textarea) {
      createScanButton(textarea, platform);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndInject);
  } else {
    detectAndInject();
  }

  // Watch for new chat elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const textareas = node.querySelectorAll ? node.querySelectorAll('textarea') : [];
          textareas.forEach(textarea => {
            if (textarea.placeholder && 
                (textarea.placeholder.toLowerCase().includes('message') ||
                 textarea.placeholder.toLowerCase().includes('prompt'))) {
              createScanButton(textarea, detectPlatform());
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

})();
