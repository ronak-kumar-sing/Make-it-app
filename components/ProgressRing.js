import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const ProgressRing = ({
  progress = 0,
  size = 100,
  strokeWidth = 10,
  textColor = '#333',
  progressColor = '#6C63FF',
  backgroundColor = '#EEEEEE',
  showPercentage = true,
  children
}) => {
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
          stroke={backgroundColor}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />

        {/* Progress Circle */}
        <Circle
          stroke={progressColor}
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
          <Text style={[styles.progressText, { color: textColor }]}>
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
