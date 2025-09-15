import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Layout from '../../components/Layout';

const theme = createTheme();

const MockLayout = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <Layout>{children}</Layout>
  </ThemeProvider>
);

describe('Layout Component', () => {
  it('renders without crashing', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByText('AgentShield')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <MockLayout>
        <div>Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Suites')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <MockLayout>
        <div data-testid="test-content">Test Content</div>
      </MockLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
