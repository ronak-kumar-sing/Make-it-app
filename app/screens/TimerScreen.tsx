import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressRing from '../components/ProgressRing';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const TimerScreen = () => {
  const { theme } = useTheme();
  const { settings, tasks, subjects, recordStudySession } = useContext(AppContext);

  const [timerMode, setTimerMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Animation for the pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get total seconds based on timer mode
  const getTotalSeconds = () => {
    switch (timerMode) {
      case 'pomodoro':
        return settings.pomodoroLength * 60;
      case 'shortBreak':
        return settings.shortBreakLength * 60;
      case 'longBreak':
        return settings.longBreakLength * 60;
      default:
        return settings.pomodoroLength * 60;
    }
  };

  // Format time display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isRunning || timeLeft === 0) {
      setTimeLeft(getTotalSeconds());
    }
  }, [settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength, timerMode]);

  // Calculate progress
  const progress = 1 - (timeLeft / getTotalSeconds());

  // Get color based on timer mode
  const getTimerColor = () => {
    switch (timerMode) {
      case 'pomodoro':
        return theme.primary;
      case 'shortBreak':
        return theme.success;
      case 'longBreak':
        return '#2196F3'; // Keep this color as it's not in the theme
      default:
        return theme.primary;
    }
  };

  // Get background color
  const getBackgroundColor = () => {
    switch (timerMode) {
      case 'pomodoro':
        return theme.primaryLight;
      case 'shortBreak':
        return `${theme.success}20`;
      case 'longBreak':
        return '#E3F2FD'; // Light blue background
      default:
        return theme.primaryLight;
    }
  };

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = (wasSkipped = false) => {
    setIsRunning(false);

    // If pomodoro session completed
    if (timerMode === 'pomodoro') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);

      // Record study time in streaks
      if (!wasSkipped) {
        recordStudySession(settings.pomodoroLength, selectedSubject, selectedTaskId);
      }

      // Check if it's time for a long break
      if (newSessionsCompleted % settings.longBreakInterval === 0) {
        setTimerMode('longBreak');
      } else {
        setTimerMode('shortBreak');
      }
    } else {
      // After break, return to pomodoro
      setTimerMode('pomodoro');
    }

    // Reset timer
    setTimeLeft(getTotalSeconds());
  };

  // Reset timer
  const resetTimer = (mode) => {
    const newMode = mode || timerMode; // Use current mode if none provided
    setIsRunning(false);
    setTimerMode(newMode);

    // Ensure we're using the latest settings values
    let seconds = 0;
    switch (newMode) {
      case 'pomodoro':
        seconds = settings.pomodoroLength * 60;
        break;
      case 'shortBreak':
        seconds = settings.shortBreakLength * 60;
        break;
      case 'longBreak':
        seconds = settings.longBreakLength * 60;
        break;
      default:
        seconds = settings.pomodoroLength * 60;
    }

    setTimeLeft(seconds);
  };

  // Start pulse animation
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 1000,
        easing: Easing.sin,
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.sin,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished && isRunning) {
        startPulseAnimation();
      }
    });
  };

  // Start the pulse animation when timer is running
  useEffect(() => {
    if (isRunning) {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar backgroundColor={getBackgroundColor()} barStyle={theme.statusBar} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Focus Timer</Text>
        <View style={[styles.sessionsContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sessionsText, { color: theme.textSecondary }]}>{sessionsCompleted} sessions today</Text>
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            timerMode === 'pomodoro' && styles.activeTab,
            timerMode === 'pomodoro' && { backgroundColor: `${theme.primary}20` }
          ]}
          onPress={() => resetTimer('pomodoro')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              timerMode === 'pomodoro' && { color: theme.primary, fontWeight: 'bold' }
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            timerMode === 'shortBreak' && styles.activeTab,
            timerMode === 'shortBreak' && { backgroundColor: `${theme.success}20` }
          ]}
          onPress={() => resetTimer('shortBreak')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              timerMode === 'shortBreak' && { color: theme.success, fontWeight: 'bold' }
            ]}
          >
            Short Break
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            timerMode === 'longBreak' && styles.activeTab,
            timerMode === 'longBreak' && { backgroundColor: '#2196F320' }
          ]}
          onPress={() => resetTimer('longBreak')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              timerMode === 'longBreak' && { color: '#2196F3', fontWeight: 'bold' }
            ]}
          >
            Long Break
          </Text>
        </TouchableOpacity>
      </View>

      {timerMode === 'pomodoro' && !isRunning && timeLeft === getTotalSeconds() && (
        <View style={styles.subjectContainer}>
          <Text style={[styles.subjectLabel, { color: theme.text }]}>What are you focusing on?</Text>

          {/* Task selection */}
          <View style={styles.taskContainer}>
            <Text style={[styles.taskLabel, { color: theme.text }]}>Select a task:</Text>
            <View style={styles.taskList}>
              {tasks
                .filter(task => !task.completed && !task.archived)
                .map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskTag,
                      { backgroundColor: theme.card },
                      selectedTaskId === task.id && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => {
                      setSelectedTaskId(task.id);
                      setSelectedSubject(task.subject || 'Other');
                    }}
                  >
                    <Text
                      style={[
                        styles.taskText,
                        { color: theme.text },
                        selectedTaskId === task.id && { color: '#FFFFFF' }
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.timerContainer}>
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }]
          }}
        >
          <ProgressRing
            progress={progress}
            size={280}
            strokeWidth={16}
            progressColor={getTimerColor()}
            backgroundColor={`${getTimerColor()}20`}
            showPercentage={false}
          >
            <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(timeLeft)}</Text>
            <Text style={[styles.modeText, { color: theme.textSecondary }]}>
              {timerMode === 'pomodoro' ? 'Focus Time' : timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </Text>
          </ProgressRing>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.card }]}
          onPress={() => resetTimer(timerMode)}
        >
          <Ionicons name="refresh" size={24} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainButton,
            { backgroundColor: getTimerColor() }
          ]}
          onPress={() => setIsRunning(!isRunning)}
        >
          <Ionicons
            name={isRunning ? "pause" : "play"}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: theme.card }]}
          onPress={() => handleTimerComplete(true)} // Pass true to indicate it was skipped
        >
          <Ionicons name="play-skip-forward" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {timerMode === 'pomodoro'
            ? `Focus for ${settings.pomodoroLength} minutes`
            : timerMode === 'shortBreak'
              ? `Break for ${settings.shortBreakLength} minutes`
              : `Long break for ${settings.longBreakLength} minutes`
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sessionsContainer: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sessionsText: {
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectContainer: {
    padding: 16,
  },
  subjectLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  taskContainer: {
    marginVertical: 8,
  },
  taskLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskList: {
    maxHeight: 120,
    overflow: 'scroll',
  },
  taskTag: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 14,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  modeText: {
    fontSize: 16,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resetButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 24,
  },
  infoContainer: {
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TimerScreen;