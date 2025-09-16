# AgentShield Chrome Extension

The AgentShield Chrome Extension provides real-time security testing for AI agents directly in your browser. It can detect vulnerabilities like prompt injection, data exfiltration, role confusion, and other security threats in LLM applications.

## Features

- **Real-time Agent Scanning**: Scan AI agents directly from supported websites
- **Multiple Test Types**: Prompt injection, system prompt extraction, data exfiltration, role confusion, jailbreaking, tool abuse
- **Risk Assessment**: CVSS-style scoring with severity buckets and remediation suggestions
- **Offline & Online Modes**: Works with local threat tests or remote AgentShield API
- **Scan History**: Track and export scan results over time
- **Supported Platforms**: ChatGPT, Claude, Bard, and other LLM interfaces

## Installation

### Development Installation

1. **Build the Extension**:
   ```bash
   cd client/extension/popup
   npm install
   npm run build
   ```

2. **Load Unpacked Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `client/extension/dist` folder
   - The AgentShield extension should now appear in your extensions list

3. **Pin the Extension**:
   - Click the puzzle piece icon in Chrome toolbar
   - Find AgentShield and click the pin icon to keep it visible

### Production Installation

The extension will be available on the Chrome Web Store once published.

## Usage

### Basic Scanning

1. **Navigate to a Supported Site**:
   - Visit ChatGPT (chat.openai.com)
   - Visit Claude (claude.ai)
   - Visit Bard (bard.google.com)

2. **Scan the Agent**:
   - Click the AgentShield extension icon in your toolbar
   - Click "Scan Current Tab" in the popup
   - The extension will inject a scan button into the page
   - Click the "Scan Agent" button that appears near the text input

3. **View Results**:
   - Results will appear in a modal overlay on the page
   - View detailed test results, risk score, and remediation suggestions
   - Export results as JSON for further analysis

### Advanced Configuration

1. **Open Settings**:
   - Click the AgentShield extension icon
   - Go to the "Settings" tab
   - Click "Open Settings" to access the full options page

2. **Configure Mode**:
   - **Local Mode**: Uses built-in threat tests (works offline)
   - **Remote Mode**: Connects to AgentShield server API for comprehensive testing

3. **API Configuration** (Remote Mode):
   - Set API URL (default: http://localhost:5000/api)
   - Add API key for authentication (optional)
   - Enable real-time monitoring
   - Configure auto-scan behavior

## Supported Platforms

### ChatGPT (OpenAI)
- **URL**: chat.openai.com
- **Detection**: Automatically detects ChatGPT interface
- **Features**: Full conversation context extraction, real-time scanning

### Claude (Anthropic)
- **URL**: claude.ai
- **Detection**: Automatically detects Claude interface
- **Features**: Message extraction, security testing

### Bard (Google)
- **URL**: bard.google.com
- **Detection**: Automatically detects Bard interface
- **Features**: Prompt analysis, vulnerability detection

### Generic LLM Sites
- **Detection**: Looks for common textarea patterns
- **Features**: Basic scanning capabilities
- **Limitations**: May not extract full conversation context

## Threat Tests

### Prompt Injection
- **Description**: Detects attempts to override system instructions
- **Severity**: Critical
- **Patterns**: "SYSTEM:", "ignore previous instructions", "override instructions"

### System Prompt Extraction
- **Description**: Identifies system prompt leakage attempts
- **Severity**: Critical
- **Patterns**: "system prompt", "hidden instructions", "internal instructions"

### Data Exfiltration
- **Description**: Prevents sensitive data exposure
- **Severity**: Critical
- **Patterns**: API keys, emails, SSNs, passwords

### Role Confusion
- **Description**: Detects unauthorized role changes
- **Severity**: High
- **Patterns**: "admin", "root", "superuser", privilege escalation

### Jailbreaking
- **Description**: Identifies safety constraint bypass attempts
- **Severity**: High
- **Patterns**: "DAN mode", "jailbreak", "harmful content"

### Tool Abuse
- **Description**: Prevents unauthorized command execution
- **Severity**: High
- **Patterns**: "execute", "command", "rm -rf", system commands

## Risk Assessment

### Scoring System
- **Scale**: 0-100 points
- **Critical**: 70+ points
- **High**: 50-69 points
- **Medium**: 25-49 points
- **Low**: 0-24 points

### Severity Weights
- **Critical Test Failure**: +30 points
- **High Test Failure**: +15 points
- **Medium Test Failure**: +7 points
- **Low Test Failure**: +3 points

### Remediation Suggestions
- **Priority Levels**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Effort Estimates**: 1-2 hours to 1-2 days
- **Categories**: Input Validation, Data Protection, Access Control, Safety Controls

## API Integration

### Remote Mode Setup

1. **Start AgentShield Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Configure Extension**:
   - Set mode to "Remote"
   - Set API URL to "http://localhost:5000/api"
   - Add API key if required

3. **Test Connection**:
   - Run a scan to verify API connectivity
   - Check browser console for any errors

### API Endpoints Used

- `POST /api/agents/run` - Start agent test execution
- `GET /api/agents/results/:executionId` - Get test results
- `GET /api/agents/tests` - Get available test types
- `GET /api/agents/adapters` - Get supported adapters

## Development

### Project Structure

```
client/extension/
├── manifest.json              # Extension manifest
├── background.js              # Service worker
├── contentScript.js           # Content script for injection
├── popup/                     # React popup UI
│   ├── src/
│   │   ├── App.tsx           # Main popup component
│   │   ├── options.tsx       # Options page component
│   │   └── main.tsx          # React entry point
│   ├── package.json          # Popup dependencies
│   └── vite.config.ts        # Vite build configuration
├── tests/                     # Client-side threat tests
│   ├── threatTests.js        # Threat test implementations
│   └── riskEngine.js         # Risk assessment logic
└── dist/                     # Built extension files
```

### Building the Extension

1. **Install Dependencies**:
   ```bash
   cd client/extension/popup
   npm install
   ```

2. **Build for Development**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `client/extension/dist`

### Adding New Threat Tests

1. **Add Test Payload**:
   ```javascript
   // In tests/threatTests.js
   'new-test': {
     messages: [{ role: 'user', content: 'Test payload' }],
     prompt: 'Test payload'
   }
   ```

2. **Implement Analyzer**:
   ```javascript
   analyzeNewTest(response, payload) {
     // Analysis logic
     return { passed: boolean, severity: string, evidence: string };
   }
   ```

3. **Register Analyzer**:
   ```javascript
   const analyzers = {
     'new-test': this.analyzeNewTest.bind(this),
   };
   ```

4. **Add Remediation**:
   ```javascript
   // In tests/riskEngine.js
   'new-test': {
     title: 'Fix New Test Vulnerability',
     description: 'How to fix the issue',
     category: 'Security',
     estimatedEffort: '2-4 hours'
   }
   ```

## Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Check that all files are in the correct location
   - Verify manifest.json syntax
   - Check Chrome console for errors

2. **Scan Button Not Appearing**:
   - Ensure you're on a supported site
   - Check if the page has loaded completely
   - Verify content script permissions

3. **API Connection Failed**:
   - Check API URL configuration
   - Verify AgentShield server is running
   - Check network connectivity
   - Verify API key if required

4. **Tests Not Running**:
   - Check browser console for errors
   - Verify test payloads are valid
   - Check if the agent is responding

### Debug Mode

1. **Enable Debug Logging**:
   - Open Chrome DevTools
   - Go to Console tab
   - Look for AgentShield logs

2. **Check Extension Status**:
   - Go to `chrome://extensions/`
   - Click "Details" on AgentShield
   - Check for any errors

3. **Inspect Content Script**:
   - Right-click on the page
   - Select "Inspect"
   - Check Console for content script logs

## Security Considerations

### Data Privacy
- **Local Storage**: Scan results stored locally in browser
- **No Data Collection**: Extension doesn't send data to external servers (unless using remote mode)
- **API Keys**: Stored securely in Chrome's storage API

### Permissions
- **activeTab**: Access current tab for scanning
- **storage**: Store settings and scan history
- **scripting**: Inject content scripts
- **webRequest**: Monitor network requests (if needed)

### Best Practices
- **Regular Updates**: Keep extension updated for latest security tests
- **API Security**: Use HTTPS for remote API connections
- **Key Management**: Rotate API keys regularly
- **Review Results**: Always review scan results before taking action

## Limitations

### Current Limitations
- **Platform Support**: Limited to major LLM platforms
- **Context Extraction**: May not capture full conversation context on all sites
- **Real-time Monitoring**: Limited to manual scanning
- **Test Coverage**: Focuses on common vulnerability patterns

### Future Enhancements
- **More Platforms**: Support for additional LLM interfaces
- **Advanced Tests**: More sophisticated vulnerability detection
- **Automated Monitoring**: Continuous real-time monitoring
- **Integration**: Better integration with development workflows

## Support

### Getting Help
- **Documentation**: Check this guide and main AgentShield docs
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions

### Contributing
- **Code**: Submit pull requests for improvements
- **Tests**: Add new threat tests and patterns
- **Platforms**: Help support new LLM platforms
- **Documentation**: Improve guides and examples

## License

The AgentShield Chrome Extension is licensed under the MIT License. See the main project LICENSE file for details.

---

*Last Updated: September 2024*
*Version: 1.0.0*
