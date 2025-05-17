import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const TimerScreen = () => {
  const { settings, recordStudySession } = useContext(AppContext);
  const [timerMode, setTimerMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroLength * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  
  const animation = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  
  // Set timer duration based on mode
  useEffect(() => {
    let duration = 0;
    
    switch (timerMode) {
      case 'focus':
        duration = settings.pomodoroLength * 60;
        break;
      case 'shortBreak':
        duration = settings.shortBreakLength * 60;
        break;
      case 'longBreak':
        duration = settings.longBreakLength * 60;
        break;
    }
    
    setTimeLeft(duration);
    
    // Reset animation
    animation.setValue(0);
    
    // If timer is active, restart animation
    if (isActive) {
      startAnimation(duration);
    }
  }, [timerMode, settings]);
  
  // Handle timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isActive]);
  
  // Start animation
  const startAnimation = (duration) => {
    Animated.timing(animation, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start();
  };
  
  // Handle timer completion
  const handleTimerComplete = () => {
    Vibration.vibrate([500, 500, 500]);
    
    if (timerMode === 'focus') {
      // Record completed focus session
      recordStudySession(settings.pomodoroLength);
      
      // Increment pomodoro count
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      // Update total focus time
      setTotalFocusTime(prev => prev + settings.pomodoroLength);
      
      // Determine next break type
      if (newCount % settings.longBreakInterval === 0) {
        setTimerMode('longBreak');
      } else {
        setTimerMode('shortBreak');
      }
    } else {
      // After break, go back to focus mode
      setTimerMode('focus');
    }
    
    setIsActive(false);
  };
  
  // Toggle timer
  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      Animated.timing(animation).stop();
    } else {
      setIsActive(true);
      startAnimation(timeLeft);
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    Animated.timing(animation).stop();
    
    let duration = 0;
    switch (timerMode) {
      case 'focus':
        duration = settings.pomodoroLength * 60;
        break;
      case 'shortBreak':
        duration = settings.shortBreakLength * 60;
        break;
      case 'longBreak':
        duration = settings.longBreakLength * 60;
        break;
    }
    
    setTimeLeft(duration);
    animation.setValue(0);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress for the circle
  const circleProgress = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 360],
  });
  
  // Get color based on timer mode
  const getColor = () => {
    switch (timerMode) {
      case 'focus':
        return '#6C63FF';
      case 'shortBreak':
        return '#4CAF50';
      case 'longBreak':
        return '#2196F3';
      default:
        return '#6C63FF';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
      </View>
      
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'focus' && { backgroundColor: '#6C63FF' }
          ]}
          onPress={() => {
            if (!isActive) setTimerMode('focus');
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              timerMode === 'focus' && { color: '#FFFFFF' }
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'shortBreak' && { backgroundColor: '#4CAF50' }
          ]}
          onPress={() => {
            if (!isActive) setTimerMode('shortBreak');
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              timerMode === 'shortBreak' && { color: '#FFFFFF' }
            ]}
          >
            Short Break
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'longBreak' && { backgroundColor: '#2196F3' }
          ]}
          onPress={() => {
            if (!isActive) setTimerMode('longBreak');
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              timerMode === 'longBreak' && { color: '#FFFFFF' }
            ]}
          >
            Long Break
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Animated.View
            style={[
              styles.timerProgress,
              {
                backgroundColor: getColor(),
                transform: [
                  {
                    rotate: circleProgress.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.timerInner}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerMode}>
              {timerMode === 'focus'
                ? 'Focus Time'
                : timerMode === 'shortBreak'
                ? 'Short Break'
                : 'Long Break'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
          <Ionicons name="refresh" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: getColor() }]}
          onPress={toggleTimer}
        >
          <Ionicons
            name={isActive ? 'pause' : 'play'}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
          <Ionicons name="skip-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pomodoroCount}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalFocusTime}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>
      
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Focus Tips</Text>
        <Text style={styles.tip}>
          • Find a quiet place without distractions
        </Text>
        <Text style={styles.tip}>
          • Put your phone on silent mode
        </Text>
        <Text style={styles.tip}>
          • Take regular breaks to maintain productivity
        </Text>
        <Text style={styles.tip}>
          • Stay hydrated and maintain good posture
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  modeButtonText: {
    fontWeight: '500',
    color: '#666',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerProgress: {
    width: 250,
    height: 250,
    borderRadius: 125,
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '0deg' }],
  },
  timerInner: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  timerMode: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default TimerScreen;