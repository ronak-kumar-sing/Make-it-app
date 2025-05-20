import { Ionicons } from '@expo/vector-icons';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, FlatList, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressRing from '../components/ProgressRing';
import TaskSelectionItem from '../components/TaskSelectionItem';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import * as NotificationService from '../services/NotificationService';

// Define background task name
const BACKGROUND_TIMER_TASK = 'background-timer-task';

// Register the background task
TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background task failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  try {
    // The data passed from the background task registration
    const { endTime, timerMode, taskTitle } = data as {
      endTime: number,
      timerMode: string,
      taskTitle?: string
    };

    // Calculate time left
    const now = Date.now();
    const timeLeftMs = Math.max(0, endTime - now);
    const timeLeftSeconds = Math.floor(timeLeftMs / 1000);

    // Update notification with current time left
    if (timeLeftSeconds > 0) {
      await NotificationService.showTimerNotification(
        timeLeftSeconds,
        timerMode,
        true,
        taskTitle
      );
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // Timer complete
      await NotificationService.cancelTimerNotification();
      await NotificationService.sendTimerCompletionNotification();
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error("Error in background timer task:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const TimerScreen = () => {
  const { theme } = useTheme();
  const { settings, tasks, subjects, stats, recordStudySession, updateTask } = useContext(AppContext);

  const [timerMode, setTimerMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [backgroundTaskRegistered, setBackgroundTaskRegistered] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const [sessionHistory, setSessionHistory] = useState<Array<{
    duration: number;
    timestamp: string;
    task?: string;
    subject?: string;
    mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  }>>([]);

  // Animation ref
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Check notification permissions on mount
  useEffect(() => {
    const checkNotificationPermission = async () => {
      const { status } = await NotificationService.checkPermissions();
      setNotificationEnabled(status === 'granted' && settings.notifications);
    };

    checkNotificationPermission();
  }, []);

  // Set initial time based on timer mode
  useEffect(() => {
    switch (timerMode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoroLength * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakLength * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakLength * 60);
        break;
    }
  }, [timerMode, settings]);

  // Set up AppState change listener to track when app goes to background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isRunning && timerEndTime) {
          // Sync timer with actual time passed
          const now = Date.now();
          const newTimeLeft = Math.max(0, Math.floor((timerEndTime - now) / 1000));

          if (newTimeLeft <= 0) {
            // Timer completed while in background
            setTimeLeft(0);
            handleTimerComplete();
          } else {
            setTimeLeft(newTimeLeft);
          }
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to the background
        if (isRunning) {
          // Make sure the timer notification is showing
          NotificationService.showTimerNotification(
            timeLeft,
            timerMode,
            isRunning,
            selectedTask?.title
          );
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, timerEndTime, timerMode, timeLeft, selectedTask]);

  // Register or unregister background task based on timer state
  useEffect(() => {
    const registerBackgroundTask = async () => {
      if (isRunning && timeLeft > 0) {
        // Calculate when the timer will end
        const endTime = Date.now() + timeLeft * 1000;
        setTimerEndTime(endTime);

        try {
          // Show the notification immediately
          await NotificationService.showTimerNotification(
            timeLeft,
            timerMode,
            isRunning,
            selectedTask?.title
          );

          // Register background task with options as data
          await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
            minimumInterval: 15, // 15 seconds minimum
            stopOnTerminate: false,
            startOnBoot: true,
            // Pass data to the background task
            taskName: BACKGROUND_TIMER_TASK,
            data: {
              endTime,
              timerMode,
              taskTitle: selectedTask?.title,
            }
          });

          setBackgroundTaskRegistered(true);
        } catch (err) {
          console.error("Failed to register background task:", err);
        }
      } else {
        // Unregister background task when timer stops
        if (backgroundTaskRegistered) {
          try {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
            await NotificationService.cancelTimerNotification();
            setBackgroundTaskRegistered(false);
            setTimerEndTime(null);
          } catch (err) {
            console.error("Failed to unregister background task:", err);
          }
        }
      }
    };

    registerBackgroundTask();
  }, [isRunning, timeLeft]);

  // Timer logic for when app is in foreground
  useEffect(() => {
    let timer: number | null = null;

    if (isRunning && timeLeft > 0) {
      // Calculate when the timer will end
      if (!timerEndTime) {
        setTimerEndTime(Date.now() + timeLeft * 1000);
      }

      // Update timer display every second
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          // Update notification every 15 seconds or when timer gets close to completion
          if (newTime % 15 === 0 || newTime < 10) {
            NotificationService.showTimerNotification(
              newTime,
              timerMode,
              isRunning,
              selectedTask?.title
            );
          }
          return newTime;
        });
      }, 1000) as unknown as number;
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setTimerEndTime(null);

    // Clean up background timer tasks
    (async () => {
      if (backgroundTaskRegistered) {
        try {
          await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
          setBackgroundTaskRegistered(false);
        } catch (err) {
          console.error("Error unregistering background task:", err);
        }
      }
    })();

    // Play sound or vibration here

    // Cancel ongoing notification and show completion notification
    (async () => {
      await NotificationService.cancelTimerNotification();

      // Show completion notification if enabled
      if (notificationEnabled) {
        const notificationTitle = timerMode === 'pomodoro' ? 'Focus Session Complete' : 'Break Time Over';
        const notificationBody = timerMode === 'pomodoro'
          ? 'Great job! Your focus session is complete.'
          : 'Break time is over. Ready to focus again?';

        await NotificationService.sendTimerCompletionNotification(notificationTitle, notificationBody);
      }
    })();

    // Record session if it was a pomodoro
    if (timerMode === 'pomodoro') {
      const sessionData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        duration: settings.pomodoroLength,
        subject: selectedTask?.subject || undefined,
        taskId: selectedTask?.id || undefined,
        isComplete: true
      };

      // Record study session in context
      recordStudySession(
        settings.pomodoroLength,
        selectedTask?.subject,
        selectedTask?.id,
        sessionData
      );

      // Update task progress if selected
      if (selectedTask) {
        const newProgress = Math.min(100, (selectedTask.progress || 0) + 20);
        updateTask(selectedTask.id, { progress: newProgress });
      }

      // Update completed pomodoros count
      setCompletedPomodoros(prev => prev + 1);

      // Add to session history
      const historyEntry = {
        duration: settings.pomodoroLength,
        timestamp: new Date().toISOString(),
        task: selectedTask?.title,
        subject: selectedTask?.subject,
        mode: timerMode
      };

      setSessionHistory(prev => [historyEntry, ...prev]);

      // Determine next timer mode
      if (completedPomodoros + 1 < settings.longBreakInterval) {
        setTimerMode('shortBreak');
      } else {
        setTimerMode('longBreak');
        setCompletedPomodoros(0);
      }
    } else {
      // After break is complete, switch back to pomodoro
      setTimerMode('pomodoro');
    }
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    // Handle notification based on timer state
    if (newIsRunning) {
      // Starting timer - show notification
      NotificationService.showTimerNotification(
        timeLeft,
        timerMode,
        true,
        selectedTask?.title
      );
    } else {
      // Pausing timer - update notification to show paused state
      NotificationService.showTimerNotification(
        timeLeft,
        timerMode,
        false,
        selectedTask?.title
      );
    }

    // Animation for button press
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerEndTime(null);

    // Cancel any ongoing background task and notifications
    (async () => {
      if (backgroundTaskRegistered) {
        try {
          await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
          setBackgroundTaskRegistered(false);
        } catch (err) {
          console.error("Error unregistering background task:", err);
        }
      }

      await NotificationService.cancelTimerNotification();
    })();

    // Reset timer based on mode
    let newTimeLeft = 0;
    switch (timerMode) {
      case 'pomodoro':
        newTimeLeft = settings.pomodoroLength * 60;
        setTimeLeft(newTimeLeft);
        break;
      case 'shortBreak':
        newTimeLeft = settings.shortBreakLength * 60;
        setTimeLeft(newTimeLeft);
        break;
      case 'longBreak':
        newTimeLeft = settings.longBreakLength * 60;
        setTimeLeft(newTimeLeft);
        break;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (): number => {
    let totalTime;

    switch (timerMode) {
      case 'pomodoro':
        totalTime = settings.pomodoroLength * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakLength * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakLength * 60;
        break;
      default:
        totalTime = settings.pomodoroLength * 60;
    }

    const progress = 1 - (timeLeft / totalTime);
    return progress;
  };

  const getTimerColor = () => {
    switch (timerMode) {
      case 'pomodoro':
        return theme.primary;
      case 'shortBreak':
        return theme.success;
      case 'longBreak':
        return theme.warning;
      default:
        return theme.primary;
    }
  };

  const openTaskSelection = () => {
    setShowTaskSelection(true);
  };

  const handleSelectTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskSelection(false);
  };

  // Clean up notifications and background tasks on component unmount
  useEffect(() => {
    return () => {
      // Clean up function for when component unmounts
      (async () => {
        try {
          if (backgroundTaskRegistered) {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TIMER_TASK);
          }
          await NotificationService.cancelTimerNotification();
        } catch (err) {
          console.error("Error cleaning up timer resources:", err);
        }
      })();
    };
  }, [backgroundTaskRegistered]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBar} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Study Timer</Text>
      </View>

      <View style={styles.modeSelection}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'pomodoro' && [styles.activeMode, { backgroundColor: theme.primary }]
          ]}
          onPress={() => !isRunning && setTimerMode('pomodoro')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: timerMode === 'pomodoro' ? '#FFFFFF' : theme.text }
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'shortBreak' && [styles.activeMode, { backgroundColor: theme.success }]
          ]}
          onPress={() => !isRunning && setTimerMode('shortBreak')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: timerMode === 'shortBreak' ? '#FFFFFF' : theme.text }
            ]}
          >
            Short Break
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            timerMode === 'longBreak' && [styles.activeMode, { backgroundColor: theme.warning }]
          ]}
          onPress={() => !isRunning && setTimerMode('longBreak')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: timerMode === 'longBreak' ? '#FFFFFF' : theme.text }
            ]}
          >
            Long Break
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <ProgressRing
          progress={calculateProgress()}
          size={300}
          strokeWidth={20}
          textColor={theme.text}
          progressColor={getTimerColor()}
          backgroundColor={`${getTimerColor()}20`}
          showPercentage={false}
        >
          <Text style={[styles.timerText, { color: theme.text }]}>{formatTime(timeLeft)}</Text>
          <Text style={[styles.timerLabel, { color: theme.textSecondary }]}>
            {timerMode === 'pomodoro' ? 'Focus Time' : timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </Text>
        </ProgressRing>
      </View>

      <View style={styles.taskSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CURRENT TASK</Text>

        {selectedTask ? (
          <View style={[styles.selectedTaskCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.selectedTaskTitle, { color: theme.text }]}>{selectedTask.title}</Text>
            {selectedTask.subject && (
              <View style={styles.taskMeta}>
                <Ionicons name="bookmark" size={14} color={theme.primary} />
                <Text style={[styles.taskMetaText, { color: theme.primary }]}>{selectedTask.subject}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.changeTaskButton}
              onPress={openTaskSelection}
            >
              <Text style={{ color: theme.primary }}>Change Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.selectTaskButton, { backgroundColor: theme.card }]}
            onPress={openTaskSelection}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.selectTaskText, { color: theme.primary }]}>Select a task</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.card }]}
          onPress={resetTimer}
        >
          <Ionicons name="refresh" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isRunning ? theme.danger : getTimerColor() }
            ]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.sessionsContainer}>
          <Text style={[styles.sessionsCount, { color: theme.text }]}>
            {completedPomodoros}/{settings.longBreakInterval}
          </Text>
          <Text style={[styles.sessionsLabel, { color: theme.textSecondary }]}>Sessions</Text>
        </View>
      </View>

      {sessionHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TODAY'S SESSIONS</Text>
          <View style={[styles.historyCard, { backgroundColor: theme.card }]}>
            <View style={styles.historyRow}>
              <Ionicons name="time" size={20} color={theme.primary} />
              <Text style={[styles.historyText, { color: theme.text }]}>
                {sessionHistory.length} session{sessionHistory.length !== 1 ? 's' : ''} completed
              </Text>
            </View>

            <View style={styles.historyRow}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <Text style={[styles.historyText, { color: theme.text }]}>
                {sessionHistory.reduce((total, session) => total + session.duration, 0)} minutes studied
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Task Selection Modal */}
      <Modal
        visible={showTaskSelection}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTaskSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select a Task</Text>
              <TouchableOpacity onPress={() => setShowTaskSelection(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={tasks.filter(task => !task.completed && !task.archived)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskSelectionItem
                  task={item}
                  isSelected={selectedTask?.id === item.id}
                  onSelect={() => handleSelectTask(item)}
                  theme={theme}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
                    No active tasks available. Create a task to track your study progress.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeMode: {
    backgroundColor: '#6C63FF',
  },
  modeButtonText: {
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionsContainer: {
    alignItems: 'center',
  },
  sessionsCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sessionsLabel: {
    fontSize: 12,
  },
  taskSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedTaskCard: {
    padding: 16,
    borderRadius: 8,
  },
  selectedTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskMetaText: {
    fontSize: 14,
    marginLeft: 4,
  },
  changeTaskButton: {
    alignItems: 'flex-end',
  },
  selectTaskButton: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectTaskText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  historySection: {
    padding: 20,
  },
  historyCard: {
    padding: 16,
    borderRadius: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  historyText: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
  },
});

export default TimerScreen;