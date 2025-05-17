import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressRing from '../../components/ProgressRing';
import { AppContext } from '../context';

const TimerScreen = () => {
  const { settings, recordStudySession, tasks, subjects, updateTask } = useContext(AppContext);

  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroLength * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Animation value
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get total seconds based on timer mode - ensure we use latest settings
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

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Handle timer completion
  const handleTimerComplete = (skipped = false) => {
    if (timerMode === 'pomodoro') {
      // Calculate time spent
      const timeSpent = getTotalSeconds() - timeLeft; // Time actually spent in seconds
      const minutesSpent = Math.floor(timeSpent / 60);
      const isSessionComplete = !skipped || (timeSpent >= getTotalSeconds() * 0.8);

      // Only count if not skipped OR if user spent at least 80% of the timer
      if (isSessionComplete) {
        // Record the actual time spent (converted to minutes)
        recordStudySession(minutesSpent > 0 ? minutesSpent : 1, selectedSubject);

        // Increment sessions completed
        setSessionsCompleted(prev => prev + 1);

        // If a task was selected, update its progress
        if (selectedTaskId) {
          const selectedTask = tasks.find(task => task.id === selectedTaskId);
          if (selectedTask) {
            // Add progress to the task (assume each completed session is 25% progress)
            const newProgress = Math.min(100, (selectedTask.progress || 0) + 25);

            // If progress reaches 100%, mark task as completed
            if (newProgress >= 100) {
              updateTask(selectedTaskId, {
                progress: 100,
                completed: true,
                completedAt: new Date().toISOString()
              });
            } else {
              updateTask(selectedTaskId, { progress: newProgress });
            }
          }
        }
      }

      // Determine if we should take a long break or short break
      const nextMode = (sessionsCompleted + 1) % settings.longBreakInterval === 0 ?
        'longBreak' : 'shortBreak';

      resetTimer(nextMode);
    } else {
      // Break is over, start a new pomodoro
      resetTimer('pomodoro');
    }

    // Reset selected task for next session
    setSelectedTaskId(null);

    // Play notification sound or vibration here
  };

  // Timer effect
  useEffect(() => {
    let interval;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete(false); // Timer completed naturally, not skipped
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Start/stop animation effect
  useEffect(() => {
    if (isRunning) {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  // Sync with settings changes
  useEffect(() => {
    // If timer is not running or just initialized, update the timer duration based on settings
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
        return '#6C63FF';
      case 'shortBreak':
        return '#4CAF50';
      case 'longBreak':
        return '#2196F3';
      default:
        return '#6C63FF';
    }
  };

  // Get background color
  const getBackgroundColor = () => {
    switch (timerMode) {
      case 'pomodoro':
        return '#F0EEFF';
      case 'shortBreak':
        return '#E8F5E9';
      case 'longBreak':
        return '#E3F2FD';
      default:
        return '#F0EEFF';
    }
  };

  // Get unique subjects from tasks and add default subjects
  const getAvailableSubjects = () => {
    // Extract subjects from incomplete tasks
    const taskSubjects = tasks
      .filter(task => !task.completed && !task.archived)
      .map(task => task.subject)
      .filter(Boolean);

    // Get unique subjects
    const uniqueSubjects = [...new Set(taskSubjects)];

    // Include standard subjects if they're not already in the list
    subjects.forEach(subj => {
      if (!uniqueSubjects.includes(subj.name)) {
        uniqueSubjects.push(subj.name);
      }
    });

    return uniqueSubjects;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() }
      ]}
    >
      <StatusBar backgroundColor={getBackgroundColor()} barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <View style={styles.sessionsContainer}>
          <Text style={styles.sessionsText}>{sessionsCompleted} sessions today</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            timerMode === 'pomodoro' && styles.activeTab,
            timerMode === 'pomodoro' && { backgroundColor: '#6C63FF20' }
          ]}
          onPress={() => resetTimer('pomodoro')}
        >
          <Text
            style={[
              styles.tabText,
              timerMode === 'pomodoro' && styles.activeTabText,
              timerMode === 'pomodoro' && { color: '#6C63FF' }
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            timerMode === 'shortBreak' && styles.activeTab,
            timerMode === 'shortBreak' && { backgroundColor: '#4CAF5020' }
          ]}
          onPress={() => resetTimer('shortBreak')}
        >
          <Text
            style={[
              styles.tabText,
              timerMode === 'shortBreak' && styles.activeTabText,
              timerMode === 'shortBreak' && { color: '#4CAF50' }
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
              timerMode === 'longBreak' && styles.activeTabText,
              timerMode === 'longBreak' && { color: '#2196F3' }
            ]}
          >
            Long Break
          </Text>
        </TouchableOpacity>
      </View>

      {timerMode === 'pomodoro' && !isRunning && timeLeft === getTotalSeconds() && (
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectLabel}>What are you focusing on?</Text>

          {/* Task selection */}
          <View style={styles.taskContainer}>
            <Text style={styles.taskLabel}>Select a task:</Text>
            <View style={styles.taskList}>
              {tasks
                .filter(task => !task.completed && !task.archived)
                .map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskTag,
                      selectedTaskId === task.id && { backgroundColor: '#6C63FF' }
                    ]}
                    onPress={() => {
                      setSelectedTaskId(task.id);
                      setSelectedSubject(task.subject || 'Other');
                    }}
                  >
                    <Text
                      style={[
                        styles.taskText,
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
            <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.modeText}>
              {timerMode === 'pomodoro' ? 'Focus Time' : timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </Text>
          </ProgressRing>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => resetTimer(timerMode)}
        >
          <Ionicons name="refresh" size={24} color="#666" />
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
          style={styles.skipButton}
          onPress={() => handleTimerComplete(true)} // Pass true to indicate it was skipped
        >
          <Ionicons name="play-skip-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
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
    backgroundColor: '#F0EEFF',
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
    color: '#333',
  },
  sessionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sessionsText: {
    color: '#666',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0EEFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  subjectContainer: {
    padding: 16,
  },
  subjectLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  // Removed subject selection styles
  taskContainer: {
    marginVertical: 8,
  },
  taskLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  taskList: {
    maxHeight: 120,
    overflow: 'scroll',
  },
  taskTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    color: '#333',
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
    color: '#333',
  },
  modeText: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
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
    color: '#666',
    textAlign: 'center',
  },
});

export default TimerScreen;
