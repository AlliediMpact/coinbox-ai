/**
 * Design Tokens for Allied iMpact Coin Box
 * This file contains all design tokens used throughout the application
 */

export const colors = {
  primary: {
    blue: '#193281',
    purple: '#5e17eb',
    gradient: 'linear-gradient(90deg, #193281 0%, #5e17eb 100%)',
  },
  neutrals: {
    white: '#FFFFFF',
    lightest: '#F8F9FA',
    light: '#E9ECEF',
    medium: '#ADB5BD',
    dark: '#495057',
    darkest: '#212529',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const typography = {
  fontFamily: {
    base: 'Inter, system-ui, sans-serif',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  fontSize: {
    h1: '2.25rem', // 36px
    h2: '1.75rem', // 28px
    h3: '1.375rem', // 22px
    h4: '1.125rem', // 18px
    body: '1rem',   // 16px
    caption: '0.75rem', // 12px
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  xxl: '3rem',   // 48px
};

export const breakpoints = {
  sm: '640px',
  md: '1024px',
  lg: '1440px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

export const radii = {
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '1rem',     // 16px
  full: '9999px', // Fully rounded (for buttons, avatars, etc.)
};

export const animations = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easings: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const designTokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  shadows,
  radii,
  animations,
};

export default designTokens;
