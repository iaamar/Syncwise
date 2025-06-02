import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  AppBar,
  Toolbar,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  useTheme,
  CssBaseline,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SyncWiseHeroImage from '../assets/images/SyncWise.png';

// Animated typing text component
const TypedText = ({ texts, delay = 3000 }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const text = texts[currentTextIndex];
    
    if (isDeleting) {
      // Deleting text
      if (currentText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((currentTextIndex + 1) % texts.length);
        setTypingSpeed(150);
      } else {
        // Delete a character
        const timeoutId = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, typingSpeed / 2);
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Typing text
      if (currentText === text) {
        // Pause at the end of the text
        const timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
        return () => clearTimeout(timeoutId);
      } else {
        // Add a character
        const timeoutId = setTimeout(() => {
          setCurrentText(text.substring(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentText, currentTextIndex, isDeleting, texts, delay, typingSpeed]);

  return (
    <Typography 
      variant="h3" 
      component="div" 
      sx={{ 
        color: 'primary.main',
        display: 'inline-block',
        minWidth: { xs: '100%', md: '500px' },
        minHeight: { xs: '80px', md: '45px' },
        position: 'relative'
      }}
    >
      {currentText}
      <Box 
        component="span" 
        sx={{ 
          borderRight: '0.1em solid',
          borderColor: 'primary.main',
          position: 'absolute',
          right: '-0.1em',
          height: '100%',
          animation: 'blink-caret 0.75s step-end infinite'
        }}
      />
    </Typography>
  );
};

// Styled Feature Card to match the screenshot
const FeatureCardStyled = ({ icon, title, description }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ p: 4, textAlign: 'center' }}>
        {/* Icon */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {icon === 'chat' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fillOpacity="0.2" />
                <rect x="6" y="8" width="12" height="2" rx="1" fill="white" />
                <rect x="6" y="12" width="12" height="2" rx="1" fill="white" />
                <rect x="6" y="16" width="6" height="2" rx="1" fill="white" />
              </svg>
            </Box>
          )}
          
          {icon === 'video' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="12" height="12" rx="2" fill="white" fillOpacity="0.2" />
                <path d="M15 8L21 6V18L15 16V8Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
                <circle cx="9" cy="12" r="2" fill="white" />
              </svg>
            </Box>
          )}
          
          {icon === 'task' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fillOpacity="0.2" />
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" />
              </svg>
            </Box>
          )}
          
          {icon === 'workspace' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="3" fill="white" fillOpacity="0.2" />
                <circle cx="6" cy="16" r="2.5" fill="white" fillOpacity="0.2" />
                <circle cx="18" cy="16" r="2.5" fill="white" fillOpacity="0.2" />
                <path d="M12 11L6 16M12 11L18 16" stroke="white" strokeWidth="1.5" />
              </svg>
            </Box>
          )}
          
          {icon === 'security' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V5L12 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" />
              </svg>
            </Box>
          )}
          
          {icon === 'ai' && (
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 2,
                color: 'white',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="14" rx="2" fill="white" fillOpacity="0.2" />
                <circle cx="7" cy="9" r="1.25" fill="white" />
                <circle cx="7" cy="15" r="1.25" fill="white" />
                <circle cx="17" cy="9" r="1.25" fill="white" />
                <circle cx="17" cy="15" r="1.25" fill="white" />
                <rect x="10" y="8" width="4" height="8" rx="1" fill="white" />
              </svg>
            </Box>
          )}
        </Box>
        
        {/* Title */}
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            minHeight: '48px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {title}
        </Typography>
        
        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            lineHeight: 1.6,
            minHeight: '80px',
            maxWidth: '275px',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {description}
        </Typography>
      </Box>
    </Paper>
  );
};

// Testimonials Carousel Section
const TestimonialsSection = () => {
  const theme = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const testimonials = [
    {
      quote: "SyncWise transformed how our remote team works together. It's like having everyone in the same room.",
      author: "Sarah Johnson",
      role: "Product Manager",
      company: "Acme Inc.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
      quote: "The integrated tools save us hours every week. We've significantly reduced our need for multiple subscriptions.",
      author: "Michael Chen",
      role: "CTO",
      company: "TechStart Labs",
      avatar: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      quote: "The AI features help us stay focused on meaningful work instead of administration. Game changer!",
      author: "Priya Patel",
      role: "Team Lead",
      company: "Global Solutions",
      avatar: "https://randomuser.me/api/portraits/women/37.jpg"
    }
  ];
  
  useEffect(() => {
    // Auto-rotate slides every 5 seconds
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };
  
  return (
    <Box 
      id="testimonials" 
      sx={{ 
        py: { xs: 8, md: 12 },
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            What Teams Say About Us
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ maxWidth: 800, mx: 'auto' }}
          >
            Thousands of teams use SyncWise to streamline their workflows and enhance productivity.
          </Typography>
        </Box>
        
        {/* Desktop: Show all testimonials in one row */}
        {!isMobile && (
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <TestimonialCardStyled 
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                  company={testimonial.company}
                  avatar={testimonial.avatar}
                />
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Mobile: Carousel */}
        {isMobile && (
          <Box>
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '300px',
              }}
            >
              {testimonials.map((testimonial, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    opacity: activeSlide === index ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    pointerEvents: activeSlide === index ? 'auto' : 'none',
                  }}
                >
                  <TestimonialCardStyled 
                    quote={testimonial.quote}
                    author={testimonial.author}
                    role={testimonial.role}
                    company={testimonial.company}
                    avatar={testimonial.avatar}
                  />
                </Box>
              ))}
            </Box>
            
            {/* Carousel Controls */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 3, 
                gap: 1 
              }}
            >
              {testimonials.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: activeSlide === index ? 'primary.main' : 'grey.300',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: activeSlide === index ? 'primary.dark' : 'grey.400',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

// Styled testimonial card
const TestimonialCardStyled = ({ quote, author, role, company, avatar }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        borderRadius: 4,
        maxWidth: 350,
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ p: 4 }}>
        {/* Quote with proper styling */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          {/* Quote marks - visible but subtle */}
          <Typography 
            variant="h3" 
            component="span" 
            sx={{ 
              position: 'absolute',
              top: -20,
              left: -10,
              color: 'primary.light',
              opacity: 0.1,
              fontFamily: 'Georgia, serif',
              fontSize: '4rem',
            }}
          >
            "
          </Typography>
          
          {/* The quote itself */}
          <Typography 
            variant="body1" 
            sx={{ 
              fontStyle: 'italic', 
              position: 'relative',
              pl: 2,
            }}
          >
            {quote}
          </Typography>
          
          {/* Closing quote mark */}
          <Typography 
            variant="h3" 
            component="span" 
            sx={{ 
              position: 'absolute',
              bottom: -30,
              right: -10,
              color: 'primary.light',
              opacity: 0.1,
              fontFamily: 'Georgia, serif',
              fontSize: '4rem',
            }}
          >
            "
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Author info */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={avatar}
            alt={author}
            sx={{ 
              width: 42, 
              height: 42, 
              mr: 2,
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {role}, {company}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // References for scroll animations
  const heroRef = useRef(null);
  
  // Typed text options
  const typedTexts = [
    "collaborate on tasks",
    "chat in real-time",
    "host video meetings",
    "share files securely",
    "manage projects efficiently"
  ];
  
  // Features data
  const features = [
    {
      icon: 'chat',
      title: "Real-time Chat",
      description: "Communicate with your team instantly. Send messages, share files, and organize conversations by channels."
    },
    {
      icon: 'video',
      title: "Video Conferencing",
      description: "Host virtual meetings with screen sharing, chat, and recording capabilities to enhance remote collaboration."
    },
    {
      icon: 'task',
      title: "Task Management",
      description: "Create, assign, and track tasks with customizable Kanban boards. Set due dates, priorities, and monitor progress."
    },
    {
      icon: 'workspace',
      title: "Team Workspaces",
      description: "Organize your work by teams and projects. Control access and keep everything in one secure location."
    },
    {
      icon: 'security',
      title: "Advanced Security",
      description: "End-to-end encryption and role-based permissions ensure your data stays private and secure."
    },
    {
      icon: 'ai',
      title: "AI-Powered Assistant",
      description: "Boost productivity with AI that summarizes discussions, schedules meetings, and automates routine tasks."
    }
  ];
  
  // Package pricing data
  const packages = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Up to 10 team members",
        "5GB storage",
        "Real-time chat",
        "Task board",
        "Limited video calls (20 min)",
        "Community support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Team",
      price: "$12",
      period: "per user/month",
      features: [
        "Unlimited team members",
        "50GB storage",
        "Advanced chat features",
        "Full task management",
        "Unlimited video calls",
        "Priority support",
        "AI assistant features"
      ],
      cta: "Try Free for 14 Days",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      features: [
        "Dedicated server",
        "Unlimited storage",
        "Premium support",
        "Custom integrations",
        "Advanced security",
        "Admin controls",
        "Usage analytics"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];
  
  // Navigation items
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleSignup = () => {
    navigate('/register');
  };
  
  const handleNavItemClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <CssBaseline />
      {/* Header/Navigation */}
      <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box 
            component="a"
            href="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none'
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #3f51b5 0%, #f50057 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              SyncWise
            </Typography>
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 4 }}>
                {navItems.map((item) => (
                  <Button 
                    key={item.label}
                    color="inherit"
                    onClick={() => handleNavItemClick(item.href)}
                    sx={{ mx: 1 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              
              <Box>
                <Button 
                  color="inherit"
                  onClick={handleLogin}
                  sx={{ mr: 2 }}
                >
                  Login
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSignup}
                  sx={{ borderRadius: 1 }}
                >
                  Sign Up Free
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton 
              edge="end" 
              color="inherit" 
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={handleMobileMenuToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.label}
                onClick={() => handleNavItemClick(item.href)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              color="primary" 
              onClick={handleLogin}
              sx={{ mb: 1 }}
            >
              Login
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary"
              onClick={handleSignup}
            >
              Sign Up Free
            </Button>
          </Box>
        </Box>
      </Drawer>
      
      {/* Hero Section */}
      <Box 
        id="home"
        ref={heroRef}
        sx={{
          bgcolor: 'background.paper',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 16 },
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hero-section"
      >
        {/* Background Pattern */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(63,81,181,0.1) 0%, rgba(245,0,87,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,0,87,0.1) 0%, rgba(63,81,181,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          }}
        />
        
        <Container 
          maxWidth="lg" 
          sx={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Hero Text Content */}
          <Box 
            className="hero-content"
            sx={{ 
              maxWidth: { xs: '100%', md: '50%' }, 
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 6, md: 0 }, 
              pr: { md: 4 },
            }}
          >
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '2.5rem', md: '3.5rem' } 
              }}
            >
              One platform for
              <br />
              <Box sx={{ display: { xs: 'none', md: 'inline-block' }, mt: 1 }}>
                <TypedText texts={typedTexts} />
              </Box>
              <Box sx={{ display: { xs: 'inline-block', md: 'none' }, mt: 1 }}>
                <TypedText texts={typedTexts} />
              </Box>
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph
              sx={{ mb: 4, maxWidth: '90%', mx: { xs: 'auto', md: 0 } }}
            >
              SyncWise brings your team's communication, tasks, and meetings into one seamless platform.
              Streamlined collaboration and AI-powered productivity in a secure workspace.
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', md: 'flex-start' }, 
                gap: 2,
              }}
            >
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleSignup}
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 1,
                  fontWeight: 'bold',
                }}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  borderRadius: 1,
                }}
              >
                View Demo
              </Button>
            </Box>
          </Box>
          
          {/* Hero Image */}
          <Box 
            className="hero-image"
            sx={{ 
              width: { xs: '100%', md: '50%' }, 
              position: 'relative',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {/* Main hero image */}
            <Box
              component="img"
              src={SyncWiseHeroImage}
              alt="SyncWise Dashboard"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 4,
                boxShadow: theme.shadows[10],
                transform: 'perspective(1000px) rotateY(-5deg)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'perspective(1000px) rotateY(-2deg) translateY(-10px)',
                  boxShadow: theme.shadows[15],
                },
              }}
            />
            
            {/* Floating elements for added visual interest */}
            <Box
              sx={{
                position: 'absolute',
                top: '10%',
                right: '-5%',
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                borderRadius: '16px',
                backgroundColor: 'primary.light',
                opacity: 0.9,
                boxShadow: theme.shadows[6],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transform: 'rotate(10deg)',
                animation: 'float 6s ease-in-out infinite',
                zIndex: 2,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="2" fill="white" fillOpacity="0.8" />
                <rect x="6" y="8" width="12" height="2" rx="1" fill="white" />
                <rect x="6" y="12" width="12" height="2" rx="1" fill="white" />
                <rect x="6" y="16" width="6" height="2" rx="1" fill="white" />
              </svg>
            </Box>
            
            <Box
              sx={{
                position: 'absolute',
                bottom: '15%',
                left: '-5%',
                width: { xs: 50, md: 70 },
                height: { xs: 50, md: 70 },
                borderRadius: '50%',
                backgroundColor: 'secondary.main',
                opacity: 0.9,
                boxShadow: theme.shadows[6],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                animation: 'float 8s ease-in-out infinite 1s',
                zIndex: 2,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" fillOpacity="0.5" />
                <path d="M16 12L10 16V8L16 12Z" fill="white" />
              </svg>
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Box 
        id="features" 
        sx={{ 
          py: { xs: 8, md: 12 },
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Features That Empower Teams
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              All the tools your team needs to communicate, collaborate, and coordinate in one unified platform.
            </Typography>
          </Box>
          
          {/* First row - 3 features */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {features.slice(0, 3).map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCardStyled 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Second row - 3 features */}
          <Grid container spacing={4}>
            {features.slice(3, 6).map((feature, index) => (
              <Grid item xs={12} md={4} key={index + 3}>
                <FeatureCardStyled 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Testimonials Section with Carousel */}
      <TestimonialsSection />
      
      {/* Pricing Section */}
      <Box 
        id="pricing" 
        sx={{ 
          py: { xs: 8, md: 12 },
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              Choose the plan that fits your team's needs. All plans include core collaboration features.
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            {packages.map((pkg, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    border: pkg.popular ? `2px solid ${theme.palette.primary.main}` : 'none',
                    transform: pkg.popular ? 'scale(1.05)' : 'none',
                    zIndex: pkg.popular ? 1 : 0,
                    boxShadow: pkg.popular ? theme.shadows[10] : theme.shadows[1],
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 2,
                    '&:hover': {
                      transform: pkg.popular ? 'scale(1.08)' : 'scale(1.03)',
                      boxShadow: theme.shadows[10],
                    },
                  }}
                  elevation={pkg.popular ? 10 : 1}
                >
                  {pkg.popular && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        py: 0.5,
                        px: 2,
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Most Popular
                      </Typography>
                    </Box>
                  )}
                  
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{ fontWeight: 'bold' }}
                    >
                      {pkg.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                      <Typography 
                        variant="h3" 
                        component="span"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {pkg.price}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        component="span" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        /{pkg.period}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 4 }}>
                      {pkg.features.map((feature, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box 
                            component="span" 
                            sx={{ 
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mr: 1.5,
                            }}
                          />
                          <Typography variant="body1">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant={pkg.popular ? "contained" : "outlined"} 
                      color="primary"
                      size="large"
                      onClick={handleSignup}
                      sx={{ 
                        py: 1.5,
                        borderRadius: 1,
                      }}
                    >
                      {pkg.cta}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Call to Action Section */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 12 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box 
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0) 100%)',
            zIndex: 0,}}
            />
            <Box 
              sx={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0) 100%)',
                zIndex: 0,
              }}
            />
            
            <Container 
              maxWidth="md" 
              sx={{ 
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                Start Collaborating Today
              </Typography>
              <Typography 
                variant="h6" 
                paragraph
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Join thousands of teams already using SyncWise to boost their productivity and streamline communication.
              </Typography>
              <Box>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  onClick={handleSignup}
                  sx={{ 
                    py: 1.5, 
                    px: 4, 
                    borderRadius: 1,
                    fontWeight: 'bold',
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    },
                  }}
                >
                  Get Started Free
                </Button>
                <Typography 
                  variant="body2" 
                  sx={{ mt: 2, opacity: 0.7 }}
                >
                  No credit card required. Free plan available forever.
                </Typography>
              </Box>
            </Container>
          </Box>
          
          {/* Footer Section */}
          <Box 
            component="footer" 
            sx={{ 
              py: 6,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Container maxWidth="lg">
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    SyncWise
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    All-in-one collaboration platform for teams of all sizes.
                    Communicate, collaborate, and coordinate in one unified workspace.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      &copy; {new Date().getFullYear()} SyncWise. All rights reserved.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Product
                  </Typography>
                  <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                    {['Features', 'Pricing', 'Integrations', 'Updates', 'Security'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                          {item}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Resources
                  </Typography>
                  <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                    {['Documentation', 'Tutorials', 'Blog', 'API', 'Community'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                          {item}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Company
                  </Typography>
                  <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                    {['About', 'Careers', 'Contact', 'Privacy', 'Terms'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                          {item}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Support
                  </Typography>
                  <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                    {['Help Center', 'Status', 'FAQ', 'Contact Us', 'Feedback'].map((item) => (
                      <Box component="li" key={item} sx={{ mb: 1 }}>
                        <Button color="inherit" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                          {item}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </>
      );
    };
    
    export default LandingPage;