import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const ProgressRing = ({
  progress = 0,
  size = 100,
  strokeWidth = 10,
  textColor,
  progressColor,
  backgroundColor,
  showPercentage = true,
  children
}) => {
  const { theme } = useTheme();

  // Use provided colors or fallback to theme colors
  const ringTextColor = textColor || theme.text;
  const ringProgressColor = progressColor || theme.primary;
  const ringBackgroundColor = backgroundColor || (theme.isDark ? `${theme.primary}30` : '#EEEEEE');

  // Calculate values for the SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - progressValue * circumference;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={ringBackgroundColor}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />

        {/* Progress Circle */}
        <Circle
          stroke={ringProgressColor}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      <View style={styles.content}>
        {showPercentage ? (
          <Text style={[styles.progressText, { color: ringTextColor }]}>
            {Math.round(progressValue * 100)}%
          </Text>
        ) : children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProgressRing;