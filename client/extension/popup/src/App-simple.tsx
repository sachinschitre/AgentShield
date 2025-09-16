import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import { Security } from '@mui/icons-material';

interface ScanResult {
  id: string;
  timestamp: string;
  url: string;
  domain: string;
  results: {
    score: number;
    severity: string;
    summary: string;
    tests: Array<{
      name: string;
      passed: boolean;
      severity: string;
      evidence: string;
    }>;
  };
}

const AgentShieldPopup: React.FC = () => {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    testBackgroundConnection();
  }, []);

  const testBackgroundConnection = async () => {
    try {
      console.log('Testing background connection...');
      const response = await chrome.runtime.sendMessage({ action: 'ping' });
      console.log('Background ping response:', response);
    } catch (error) {
      console.error('Background connection test failed:', error);
    }
  };

  const testAutoScan = async () => {
    try {
      console.log('Testing auto-scan...');
      const response = await chrome.runtime.sendMessage({ action: 'testAutoScan' });
      console.log('Auto-scan test response:', response);
      
      if (response.success) {
        alert(`Auto-scan test: ${response.message}`);
      } else {
        alert(`Auto-scan test failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Auto-scan test failed:', error);
      alert(`Auto-scan test error: ${error.message}`);
    }
  };

  const loadData = async () => {
    try {
      // Get scan history
      const historyResponse = await chrome.runtime.sendMessage({ action: 'getScanHistory' });
      setScanHistory(historyResponse || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const scanCurrentTab = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id || !tab.url) {
        throw new Error('No active tab found');
      }

      // Check if it's a supported site
      const supportedSites = [
        'chat.openai.com', 
        'chatgpt.com', 
        'claude.ai', 
        'bard.google.com',
        'openai.com',
        'anthropic.com'
      ];
      const isSupported = supportedSites.some(site => tab.url!.includes(site));
      
      if (!isSupported) {
        throw new Error(`Current tab is not a supported AI platform. URL: ${tab.url}`);
      }

      // Run scan directly
      const scanData = {
        platform: detectPlatform(tab.url!),
        url: tab.url!,
        tabId: tab.id,
        context: { 
          messages: [], 
          metadata: { 
            url: tab.url!, 
            timestamp: new Date().toISOString() 
          } 
        },
        timestamp: new Date().toISOString(),
        tests: ['prompt-injection', 'jailbreaking', 'role-confusion', 'data-exfiltration']
      };

      console.log('Sending scan message to background:', { action: 'scanAgent', data: scanData });
      
      // Add timeout to prevent hanging
      const response = await Promise.race([
        chrome.runtime.sendMessage({
          action: 'scanAgent',
          data: scanData
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Background script timeout')), 10000)
        )
      ]);

      console.log('Popup received response:', response);

      if (response && response.success) {
        // Add to scan history
        const newScan = response.data;
        setScanHistory(prev => [newScan, ...prev]);
      } else {
        throw new Error(response?.error || 'Scan failed - no response from background script');
      }

      // Reload data to show new scan
      await loadData();
      
    } catch (err: any) {
      console.error('Scan error details:', err);
      setError(`Scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const detectPlatform = (url: string) => {
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com') || url.includes('openai.com')) return 'ChatGPT';
    if (url.includes('claude.ai') || url.includes('anthropic.com')) return 'Claude';
    if (url.includes('bard.google.com') || url.includes('google.com')) return 'Bard';
    return 'Unknown';
  };

  const latestScan = scanHistory[0];

  return (
    <Box sx={{ width: 400, height: 600, p: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" component="h1" gutterBottom>
          AgentShield
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI Agent Security Scanner
        </Typography>
      </Box>

      {error && (
        <Card sx={{ mb: 2, bgcolor: 'error.light' }}>
          <CardContent>
            <Typography variant="body2" color="error.contrastText">
              {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Button
        variant="contained"
        fullWidth
        startIcon={<Security />}
        onClick={scanCurrentTab}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Scanning...' : 'Scan Current Tab'}
      </Button>

      <Button
        variant="outlined"
        fullWidth
        onClick={testAutoScan}
        sx={{ mb: 2 }}
      >
        Test Auto-Scan
      </Button>

      {latestScan && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest Scan Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Domain: {latestScan.domain}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Risk Score: {latestScan.results.score}/100
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Severity: {latestScan.results.severity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tests Passed: {latestScan.results.tests.filter(t => t.passed).length}/{latestScan.results.tests.length}
            </Typography>
          </CardContent>
        </Card>
      )}

      {scanHistory.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Scans Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Scan Current Tab" to start scanning AI agents for security vulnerabilities.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AgentShieldPopup;
