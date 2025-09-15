import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Home from '../../pages/index';

const theme = createTheme();

const MockHome = () => (
  <ThemeProvider theme={theme}>
    <Home />
  </ThemeProvider>
);

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<MockHome />);
    
    expect(screen.getByText('AgentShield')).toBeInTheDocument();
  });

  it('renders hero section', () => {
    render(<MockHome />);
    
    expect(screen.getByText('Secure Your AI Agents')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive security testing/)).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<MockHome />);
    
    expect(screen.getByText('Dynamic Test Case Creation')).toBeInTheDocument();
    expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive Reporting')).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<MockHome />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });
});
