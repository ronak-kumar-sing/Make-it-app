// Modern color palette optimized for student productivity app
// Uses a calming yet energetic color scheme

export const Colors = {
  // Primary brand colors - Vibrant purple-blue gradient feel
  primary: {
    main: '#6366F1',      // Indigo-500 - Main brand color
    light: '#A5B4FC',     // Indigo-300
    dark: '#4338CA',      // Indigo-700
    contrast: '#FFFFFF',
  },

  // Secondary accent colors
  secondary: {
    main: '#EC4899',      // Pink-500
    light: '#F9A8D4',     // Pink-300
    dark: '#BE185D',      // Pink-700
    contrast: '#FFFFFF',
  },

  // Success/Completion colors
  success: {
    main: '#10B981',      // Emerald-500
    light: '#6EE7B7',     // Emerald-300
    dark: '#047857',      // Emerald-700
    bg: '#D1FAE5',        // Emerald-100
  },

  // Warning colors
  warning: {
    main: '#F59E0B',      // Amber-500
    light: '#FCD34D',     // Amber-300
    dark: '#B45309',      // Amber-700
    bg: '#FEF3C7',        // Amber-100
  },

  // Error/Danger colors
  error: {
    main: '#EF4444',      // Red-500
    light: '#FCA5A5',     // Red-300
    dark: '#B91C1C',      // Red-700
    bg: '#FEE2E2',        // Red-100
  },

  // Info colors
  info: {
    main: '#3B82F6',      // Blue-500
    light: '#93C5FD',     // Blue-300
    dark: '#1D4ED8',      // Blue-700
    bg: '#DBEAFE',        // Blue-100
  },

  // Subject/Category colors for visual distinction
  subjects: {
    math: '#8B5CF6',      // Purple
    science: '#10B981',   // Green
    english: '#F59E0B',   // Amber
    history: '#EF4444',   // Red
    computer: '#3B82F6',  // Blue
    art: '#EC4899',       // Pink
    music: '#14B8A6',     // Teal
    language: '#F97316',  // Orange
    sports: '#22C55E',    // Lime
    other: '#6B7280',     // Gray
  },

  // Priority colors
  priority: {
    high: '#EF4444',      // Red
    medium: '#F59E0B',    // Amber
    low: '#10B981',       // Green
  },

  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Light theme configuration
export const LightTheme = {
  // Backgrounds
  background: Colors.gray[50],
  backgroundSecondary: Colors.white,
  surface: Colors.white,
  card: Colors.white,
  
  // Text colors
  text: Colors.gray[900],
  textSecondary: Colors.gray[600],
  textTertiary: Colors.gray[400],
  textInverse: Colors.white,
  
  // Primary brand
  primary: Colors.primary.main,
  primaryLight: `${Colors.primary.main}15`,
  primaryDark: Colors.primary.dark,
  
  // Secondary
  secondary: Colors.secondary.main,
  secondaryLight: `${Colors.secondary.main}15`,
  
  // Semantic colors
  success: Colors.success.main,
  successLight: Colors.success.bg,
  warning: Colors.warning.main,
  warningLight: Colors.warning.bg,
  error: Colors.error.main,
  errorLight: Colors.error.bg,
  danger: Colors.error.main,
  info: Colors.info.main,
  infoLight: Colors.info.bg,
  
  // Borders
  border: Colors.gray[200],
  borderLight: Colors.gray[100],
  borderFocus: Colors.primary.main,
  
  // Input
  inputBackground: Colors.gray[100],
  inputBorder: Colors.gray[300],
  inputText: Colors.gray[900],
  inputPlaceholder: Colors.gray[400],
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  
  // Tab bar
  tabBar: Colors.white,
  tabBarActive: Colors.primary.main,
  tabBarInactive: Colors.gray[400],
  
  // Status bar
  statusBar: 'dark-content' as const,
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Gradients (for use with LinearGradient)
  gradientPrimary: [Colors.primary.main, Colors.primary.dark],
  gradientSecondary: [Colors.secondary.main, Colors.secondary.dark],
  gradientSuccess: [Colors.success.main, Colors.success.dark],
};

// Dark theme configuration  
export const DarkTheme = {
  // Backgrounds
  background: Colors.gray[900],
  backgroundSecondary: Colors.gray[800],
  surface: Colors.gray[800],
  card: Colors.gray[800],
  
  // Text colors
  text: Colors.gray[50],
  textSecondary: Colors.gray[400],
  textTertiary: Colors.gray[500],
  textInverse: Colors.gray[900],
  
  // Primary brand
  primary: Colors.primary.light,
  primaryLight: `${Colors.primary.main}25`,
  primaryDark: Colors.primary.main,
  
  // Secondary
  secondary: Colors.secondary.light,
  secondaryLight: `${Colors.secondary.main}25`,
  
  // Semantic colors
  success: Colors.success.light,
  successLight: `${Colors.success.main}20`,
  warning: Colors.warning.light,
  warningLight: `${Colors.warning.main}20`,
  error: Colors.error.light,
  errorLight: `${Colors.error.main}20`,
  danger: Colors.error.light,
  info: Colors.info.light,
  infoLight: `${Colors.info.main}20`,
  
  // Borders
  border: Colors.gray[700],
  borderLight: Colors.gray[800],
  borderFocus: Colors.primary.light,
  
  // Input
  inputBackground: Colors.gray[700],
  inputBorder: Colors.gray[600],
  inputText: Colors.gray[50],
  inputPlaceholder: Colors.gray[500],
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.5)',
  
  // Tab bar
  tabBar: Colors.gray[900],
  tabBarActive: Colors.primary.light,
  tabBarInactive: Colors.gray[500],
  
  // Status bar
  statusBar: 'light-content' as const,
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Gradients
  gradientPrimary: [Colors.primary.light, Colors.primary.main],
  gradientSecondary: [Colors.secondary.light, Colors.secondary.main],
  gradientSuccess: [Colors.success.light, Colors.success.main],
};

export type ThemeColors = typeof LightTheme;
