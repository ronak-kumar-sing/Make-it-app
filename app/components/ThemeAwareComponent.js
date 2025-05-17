import { Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ThemeAwareComponent = ({ children, style }) => {
  const { theme } = useTheme();

  return (
    <Animated.View style={[{ backgroundColor: theme.background }, style]}>
      {children}
    </Animated.View>
  );
};

export default ThemeAwareComponent;