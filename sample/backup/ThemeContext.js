import React, { createContext } from 'react';

// Theme color definitions - only using light theme now
export const lightTheme = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#6C63FF',
  primaryLight: '#F0EEFF',
  accent: '#FF8A65',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  border: '#EEEEEE',
  divider: '#E0E0E0',
  icon: '#666666',
  statusBar: 'dark-content',
};

// Create context with just the light theme
export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const theme = lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export with proper name for default import
export default ThemeProvider;
