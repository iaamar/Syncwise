import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={(theme) => ({
        // Cursor animation
        '@keyframes blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: theme.palette.primary.main },
        },
        
        // Floating animation for hero elements
        '@keyframes float': {
          '0%': {
            transform: 'translateY(0px) rotate(10deg)',
          },
          '50%': {
            transform: 'translateY(-10px) rotate(10deg)',
          },
          '100%': {
            transform: 'translateY(0px) rotate(10deg)',
          },
        },
        
        // Pulse animation for CTA buttons
        '@keyframes pulse': {
          '0%': {
            boxShadow: '0 0 0 0 rgba(63, 81, 181, 0.4)',
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(63, 81, 181, 0)',
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(63, 81, 181, 0)',
          },
        },
        
        // Fade in animation for content sections
        '@keyframes fadeIn': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        
        // Apply fadeIn animation to sections as they come into view
        '.hero-content': {
          animation: 'fadeIn 0.8s ease-out forwards',
        },
        '.hero-image': {
          animation: 'fadeIn 1.2s ease-out forwards',
        },
        
        // Smooth scrolling for entire page
        'html': {
          scrollBehavior: 'smooth',
        },
        
        // Better focus styles
        'a, button, [tabindex="0"]': {
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        },
        
        // Custom scrollbar
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        '*::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        },
        
        // Better typography
        'body': {
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        
        // Make images responsive
        'img': {
          maxWidth: '100%',
          height: 'auto',
        },
        
        // Transitions for hover effects
        'a, button': {
          transition: 'all 0.2s ease-in-out',
        },
        
        // Card hover effects
        '.MuiCard-root, .MuiPaper-root': {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        },
        
        // Animation for CTA buttons
        '.cta-button': {
          animation: 'pulse 2s infinite',
        },
        
        // Improve section transitions
        '.section': {
          transition: 'background-color 0.5s ease',
        },
      })}
    />
  );
};

export default GlobalStyles;