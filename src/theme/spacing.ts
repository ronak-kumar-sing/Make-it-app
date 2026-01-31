import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number): number => 
  (SCREEN_WIDTH / guidelineBaseWidth) * size;

export const verticalScale = (size: number): number => 
  (SCREEN_HEIGHT / guidelineBaseHeight) * size;

export const moderateScale = (size: number, factor = 0.5): number => 
  size + (scale(size) - size) * factor;

// Screen dimensions
export const Screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isLargeDevice: SCREEN_WIDTH >= 414,
};

// Spacing system (8px base grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// Typography system
export const Typography = {
  // Font families (using system fonts for now, can be replaced with custom fonts)
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 28,
    headline: 32,
    hero: 40,
  },

  // Line heights
  lineHeight: {
    xs: 14,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 30,
    xxxl: 36,
    display: 40,
    headline: 44,
    hero: 52,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Common text styles
export const TextStyles = StyleSheet.create({
  // Headings
  hero: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.hero,
    letterSpacing: Typography.letterSpacing.tight,
  },
  headline: {
    fontSize: Typography.fontSize.headline,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.headline,
    letterSpacing: Typography.letterSpacing.tight,
  },
  title1: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight.display,
  },
  title2: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.lineHeight.xxxl,
  },
  title3: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.lineHeight.xxl,
  },
  
  // Body text
  bodyLarge: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.lg,
  },
  body: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.md,
  },
  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.sm,
  },
  
  // Labels
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.lineHeight.sm,
    letterSpacing: Typography.letterSpacing.wide,
  },
  labelSmall: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.lineHeight.xs,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  
  // Caption
  caption: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.sm,
  },
  
  // Button text
  button: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.lineHeight.lg,
    letterSpacing: Typography.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.lineHeight.md,
    letterSpacing: Typography.letterSpacing.wide,
  },
});

// Shadow styles
export const Shadows = Platform.select({
  ios: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
  },
  android: {
    small: { elevation: 2 },
    medium: { elevation: 4 },
    large: { elevation: 8 },
    xl: { elevation: 16 },
  },
  default: {},
});

// Common layout styles
export const Layout = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});

// Hit slop for touch targets
export const HitSlop = {
  small: { top: 8, right: 8, bottom: 8, left: 8 },
  medium: { top: 12, right: 12, bottom: 12, left: 12 },
  large: { top: 20, right: 20, bottom: 20, left: 20 },
};

// Animation timings
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};
