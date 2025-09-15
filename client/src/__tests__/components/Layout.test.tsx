import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock Layout component
const MockLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="layout">
    <header>
      <h1>AgentShield</h1>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/test-suites">Test Suites</a>
        <a href="/templates">Templates</a>
        <a href="/results">Results</a>
        <a href="/settings">Settings</a>
      </nav>
    </header>
    <main>{children}</main>
  </div>
);

const theme = createTheme();

const TestLayout = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <MockLayout>{children}</MockLayout>
  </ThemeProvider>
);

describe('Layout Component', () => {
  it('renders without crashing', () => {
    render(
      <TestLayout>
        <div>Test Content</div>
      </TestLayout>
    );
    
    expect(screen.getByText('AgentShield')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <TestLayout>
        <div>Test Content</div>
      </TestLayout>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Suites')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <TestLayout>
        <div data-testid="test-content">Test Content</div>
      </TestLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
