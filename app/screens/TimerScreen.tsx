import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, FlatList, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressRing from '../components/ProgressRing';
import TaskSelectionItem from '../components/TaskSelectionItem';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  clearTimerState,
  getTimerState,
  initializeTimerState,
  registerTimerBackgroundTask,
  unregisterTimerBackgroundTask
} from '../services/TimerBackgroundTask';
import { cancelTimerNotification, sendTimerCompletionNotification, showTimerNotification } from '../services/TimerNotification';

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
      const { status } = await Notifications.getPermissionsAsync();
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
            (async () => {
              await showTimerNotification(
                newTime,
                timerMode,
                isRunning,
                selectedTask?.title
              );
            })();
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
  }, [isRunning, timeLeft]); // timerEndTime removed as it's set by toggleTimer or AppState

  const handleTimerComplete = useCallback(async () => { // Make async and wrap with useCallback
    console.log('handleTimerComplete called. Current timerMode:', timerMode, 'isRunning state variable before setIsRunning(false): ', isRunning);
    setIsRunning(false);
    setTimerEndTime(null);

    // Clean up background timer tasks and state
    await unregisterTimerBackgroundTask();
    await clearTimerState(); // Clear state from AsyncStorage
    console.log('handleTimerComplete: Background task unregistered and timer state cleared.');

    // Cancel ongoing notification and show completion notification
    await cancelTimerNotification();

    if (notificationEnabled) {
      const notificationTitle = timerMode === 'pomodoro' ? 'Focus Session Complete' : 'Break Time Over';
      const notificationBody = timerMode === 'pomodoro'
        ? 'Great job! Your focus session is complete.'
        : 'Break time is over. Ready to focus again?';
      await sendTimerCompletionNotification(notificationTitle, notificationBody);
      console.log('handleTimerComplete: Completion notification sent.');
    }

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
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      console.log('handleTimerComplete: Pomodoro session recorded. Completed pomodoros:', newCompletedPomodoros);

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
      if (newCompletedPomodoros < settings.longBreakInterval) {
        setTimerMode('shortBreak');
        console.log('handleTimerComplete: Switched to shortBreak mode.');
      } else {
        setTimerMode('longBreak');
        setCompletedPomodoros(0); // Reset for the next cycle
        console.log('handleTimerComplete: Switched to longBreak mode, reset completed pomodoros.');
      }
    } else {
      // After break is complete, switch back to pomodoro
      setTimerMode('pomodoro');
      console.log('handleTimerComplete: Switched to pomodoro mode after break.');
    }
  }, [
    timerMode,
    settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength, settings.longBreakInterval, // Include specific settings fields
    selectedTask,
    completedPomodoros,
    notificationEnabled,
    recordStudySession,
    updateTask,
    setCompletedPomodoros, // State setters
    setSessionHistory,
    setTimerMode,
    setIsRunning,
    setTimerEndTime
  ]);

  // Set up AppState change listener to track when app goes to background/foreground
  useEffect(() => {
    const processForegrounding = async () => {
      console.log('Processing foregrounding / initial mount state restoration.');
      const state = await getTimerState();
      console.log('Mount/Foreground: Fetched state from AsyncStorage:', state);

      if (state) {
        const initialTimerMode = state.timerMode as 'pomodoro' | 'shortBreak' | 'longBreak';
        // Set timerMode first, as other logic might depend on it (e.g., handleTimerComplete, default timeLeft)
        setTimerMode(initialTimerMode);

        if (state.isRunning && state.endTime) { // Ensure endTime is present for running state
          const now = Date.now();
          const newTimeLeft = Math.max(0, Math.floor((state.endTime - now) / 1000));
          console.log(`Mount/Foreground: Timer was running. endTime: ${state.endTime}, now: ${now}, newTimeLeft: ${newTimeLeft}`);

          if (newTimeLeft <= 0) {
            console.log('Mount/Foreground: Timer completed while app was closed/killed or in background.');
            setTimeLeft(0);
            // Ensure timerMode is correctly set from 'state' before calling handleTimerComplete
            // which is already done by setTimerMode(initialTimerMode) above.
            handleTimerComplete();
          } else {
            console.log('Mount/Foreground: Timer still running, resuming.');
            setTimeLeft(newTimeLeft);
            setTimerEndTime(state.endTime);
            setIsRunning(true);
          }
        } else if (!state.isRunning && state.timeLeft === 0 && state.endTime !== null && state.endTime < Date.now()) {
          console.log('Mount/Foreground: Timer was marked as completed in background/killed. Calling handleTimerComplete.');
          setTimeLeft(0);
          // Ensure timerMode is correctly set from 'state' before calling handleTimerComplete
          // which is already done by setTimerMode(initialTimerMode) above.
          handleTimerComplete();
        } else {
          // Timer was paused, stopped, or reset.
          console.log('Mount/Foreground: Timer not actively running or already handled. Restoring state (paused/stopped).');
          if (isRunning && !state.isRunning) {
            setIsRunning(false);
          }

          // If state.timeLeft is 0 and it's not a "completed" scenario from above,
          // it means it was paused at 0 or reset. Reset to full duration for the mode.
          let newTimeLeftToSet;
          if (state.timeLeft > 0) {
            newTimeLeftToSet = state.timeLeft;
          } else { // timeLeft is 0, not running, not a background completion case.
            switch (initialTimerMode) {
              case 'pomodoro': newTimeLeftToSet = settings.pomodoroLength * 60; break;
              case 'shortBreak': newTimeLeftToSet = settings.shortBreakLength * 60; break;
              case 'longBreak': newTimeLeftToSet = settings.longBreakLength * 60; break;
              default: newTimeLeftToSet = settings.pomodoroLength * 60;
            }
          }
          setTimeLeft(newTimeLeftToSet);
          // timerMode is already set by setTimerMode(initialTimerMode)
          setTimerEndTime(state.endTime); // This will be null if paused correctly
          setIsRunning(false); // Ensure isRunning is false for paused/stopped state
          console.log(`Mount/Foreground: Restored state: timeLeft=${newTimeLeftToSet}, timerMode=${initialTimerMode}, endTime=${state.endTime}, isRunning=false`);
        }
      } else {
        console.log('Mount/Foreground: No timer state found in AsyncStorage. Initializing defaults based on current timerMode.');
        // Default state is already set by useState and useEffect([timerMode, settings])
        // For an initial mount, timerMode is 'pomodoro'. useEffect([timerMode, settings]) will set timeLeft.
        // If this is a foreground event and somehow state was cleared, this ensures timeLeft is reset.
        switch (timerMode) {
          case 'pomodoro': setTimeLeft(settings.pomodoroLength * 60); break;
          case 'shortBreak': setTimeLeft(settings.shortBreakLength * 60); break;
          case 'longBreak': setTimeLeft(settings.longBreakLength * 60); break;
        }
        setIsRunning(false);
        setTimerEndTime(null);
      }
    };

    const handleAppStateChange = async (nextAppState: string) => {
      const currentAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground via AppState change.');
        await processForegrounding();
      } else if (currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App went to background. isRunning:', isRunning, 'timerEndTime:', timerEndTime, 'timeLeft:', timeLeft);
        if (isRunning && timerEndTime && timeLeft > 0) {
          console.log('Background: Saving running timer state');
          await initializeTimerState({
            endTime: timerEndTime,
            timeLeft,
            isRunning: true,
            timerMode,
            taskTitle: selectedTask?.title,
          });
          await registerTimerBackgroundTask();
          console.log('Background: Timer state saved and background task registered.');
        } else if (!isRunning && timeLeft > 0) { // Timer is paused with time left
          console.log('Background: Saving paused timer state');
          await initializeTimerState({
            endTime: null, // No fixed end time for paused state
            timeLeft,
            isRunning: false,
            timerMode,
            taskTitle: selectedTask?.title,
          });
          // No background task for paused timers
          console.log('Background: Paused timer state saved. No background task.');
        } else {
          console.log('Background: Timer not in a state to be saved for background (e.g. stopped, completed, or running with no time left).');
        }
      }
    };

    // Initial state restoration on mount
    processForegrounding();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [
    isRunning, timerEndTime, timerMode, timeLeft, selectedTask,
    settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength,
    completedPomodoros, handleTimerComplete
  ]);

  // Register or unregister background task based on timer state
  useEffect(() => {
    // This effect handles showing/updating notification when timer starts/resumes,
    // or when timerMode/selectedTask changes while running.
    // It also cancels notifications when the timer is not running.
    // Frequent updates (every 15s) while running are handled by the foreground interval timer.
    if (isRunning && timeLeft > 0) {
      (async () => {
        console.log(`NotificationEffect: Timer is running (timeLeft: ${timeLeft}, mode: ${timerMode}). Showing/Updating notification.`);
        await showTimerNotification(
          timeLeft, // Pass current timeLeft for accurate content
          timerMode,
          true, // isRunning is true here
          selectedTask?.title
        );
      })();
    } else if (!isRunning) {
      (async () => {
        console.log('NotificationEffect: Timer is not running. Cancelling notification.');
        await cancelTimerNotification();
      })();
    }
    // Dependencies: isRunning (to trigger start/stop), timerMode/selectedTask (to update if they change while running).
    // timeLeft is NOT a direct dependency to avoid updates every second from this effect.
    // However, the `timeLeft` variable used inside IS from the outer scope, so it's current when the effect runs.
  }, [isRunning, timerMode, selectedTask]);

  const toggleTimer = async () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    if (newIsRunning) {
      // Starting or resuming timer
      let currentTimerEndTime = timerEndTime;
      // If timerEndTime is not set, or if timeLeft is at the full duration (fresh start for the mode)
      // or if timeLeft is what was stored for a paused timer (timerEndTime would be null)
      if (!currentTimerEndTime || timeLeft === (timerMode === 'pomodoro' ? settings.pomodoroLength * 60 : (timerMode === 'shortBreak' ? settings.shortBreakLength * 60 : settings.longBreakLength * 60))) {
        currentTimerEndTime = Date.now() + timeLeft * 1000;
      }
      // If resuming a paused timer, timeLeft is already set. currentTimerEndTime needs to be calculated.
      // If timerEndTime was null (paused) or we are starting fresh, calculate new end time.
      if (!timerEndTime) { // This covers fresh starts and resuming from pause (where timerEndTime was set to null)
        currentTimerEndTime = Date.now() + timeLeft * 1000;
      } // If timerEndTime already exists (e.g. app was backgrounded while running and came back), we use that.
      // However, the AppState listener should handle restoring timerEndTime correctly.
      // For a manual toggle to "run", we should always calculate a new endTime based on current timeLeft.
      currentTimerEndTime = Date.now() + timeLeft * 1000;
      setTimerEndTime(currentTimerEndTime);

      console.log(`toggleTimer: Starting/Resuming. timeLeft: ${timeLeft}, new endTime: ${currentTimerEndTime}`);
      await initializeTimerState({
        endTime: currentTimerEndTime!,
        timeLeft,
        isRunning: true,
        timerMode,
        taskTitle: selectedTask?.title,
      });
      await registerTimerBackgroundTask();
    } else {
      // Timer is being paused
      console.log(`toggleTimer: Pausing. timeLeft: ${timeLeft}`);
      setTimerEndTime(null); // Important for paused state
      await unregisterTimerBackgroundTask();
      await cancelTimerNotification();
      await initializeTimerState({ // Save paused state
        endTime: null,
        timeLeft,
        isRunning: false,
        timerMode,
        taskTitle: selectedTask?.title,
      });
      console.log('toggleTimer: Paused state saved to AsyncStorage.');
    }
  };

  const resetTimer = async () => { // Make async
    setIsRunning(false);
    setTimerEndTime(null);

    await unregisterTimerBackgroundTask();
    await cancelTimerNotification();
    await clearTimerState(); // Clear state from AsyncStorage

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
      (async () => {
        if (isRunning) { // If timer was running on unmount, try to clean up
          await unregisterTimerBackgroundTask();
          await cancelTimerNotification();
          // Consider if clearTimerState() is needed here,
          // or if background task should continue if app is just closing view vs. terminating
        }
      })();
    };
  }, [isRunning]); // Depend on isRunning

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