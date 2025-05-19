import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Define theme types
export type ThemeType = {
  background: string;
  backgroundAlt: string; // Added new property
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  primaryDark: string; // Added new property
  border: string;
  icon: string;
  success: string;
  warning: string;
  danger: string;
  buttonText: string; // Added new property
  statusBar: 'light-content' | 'dark-content';
};

// Define light theme
export const lightTheme: ThemeType = {
  background: '#F8F9FA',
  backgroundAlt: '#F0F0F0', // Added new value
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#6C63FF',
  primaryLight: '#F0EEFF',
  primaryDark: '#5A53D5', // Added new value
  border: '#EEEEEE',
  icon: '#757575',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  buttonText: '#FFFFFF', // Added new value
  statusBar: 'dark-content',
};

// Define dark theme
export const darkTheme: ThemeType = {
  background: '#121212',
  backgroundAlt: '#1A1A1A', // Added new value
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#8F85FF',
  primaryLight: '#2C2A3A',
  primaryDark: '#453E9E', // Added new value
  border: '#333333',
  icon: '#BBBBBB',
  success: '#66BB6A',
  warning: '#FFCA28',
  danger: '#EF5350',
  buttonText: '#FFFFFF', // Added new value
  statusBar: 'light-content',
};

// Create theme context
type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => { },
  setThemeMode: () => { },
  themeMode: 'system',
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((savedThemeMode) => {
      if (savedThemeMode) {
        setThemeMode(savedThemeMode as 'light' | 'dark' | 'system');
      }
    });
  }, []);

  // Update theme based on mode and system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }

    // Save theme preference
    AsyncStorage.setItem('themeMode', themeMode);
  }, [themeMode, systemColorScheme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      if (prevMode === 'light') return 'dark';
      if (prevMode === 'dark') return 'system';
      return 'light';
    });
  };

  // Get current theme
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setThemeMode, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;