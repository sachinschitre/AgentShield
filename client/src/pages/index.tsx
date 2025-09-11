import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { Security, BugReport, Assessment, Speed } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

const features = [
  {
    icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Input Injection Testing',
    description: 'Comprehensive testing for SQL injection, XSS, command injection, and other input-based vulnerabilities.',
    color: '#ef4444'
  },
  {
    icon: <BugReport sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'API Fuzzing',
    description: 'Automated API security testing including authentication bypass, rate limiting, and input validation.',
    color: '#3b82f6'
  },
  {
    icon: <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Agentic Workflow Testing',
    description: 'Specialized testing for AI agent vulnerabilities including prompt injection and role confusion.',
    color: '#8b5cf6'
  },
  {
    icon: <Speed sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Real-time Execution',
    description: 'Execute tests in parallel or sequence with real-time monitoring and detailed result analysis.',
    color: '#16a34a'
  }
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
            mb: 6
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            AgentShield
          </Typography>
          <Typography variant="h5" component="p" sx={{ mb: 4, opacity: 0.9 }}>
            Comprehensive Security Testing for Agentic AI Applications
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
            Detect vulnerabilities, test edge cases, and ensure your AI applications are secure 
            with our powerful testing platform designed specifically for agentic systems.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Section */}
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Key Features
        </Typography>
        
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Secure Your AI Applications?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Start testing your agentic AI applications today with our comprehensive security testing platform.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Testing Now
          </Button>
        </Box>
      </Container>
    </Layout>
  );
}
