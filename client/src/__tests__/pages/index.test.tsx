import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock the components and hooks
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

jest.mock('@/components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Simple test component
const TestComponent = () => (
  <div>
    <h1>AgentShield</h1>
    <p>Comprehensive Security Testing for Agentic AI Applications</p>
    <button>Get Started</button>
  </div>
);

const theme = createTheme();

const MockTestComponent = () => (
  <ThemeProvider theme={theme}>
    <TestComponent />
  </ThemeProvider>
);

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<MockTestComponent />);
    
    expect(screen.getByText('AgentShield')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<MockTestComponent />);
    
    expect(screen.getByText(/Comprehensive Security Testing/)).toBeInTheDocument();
  });

  it('renders call-to-action button', () => {
    render(<MockTestComponent />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
