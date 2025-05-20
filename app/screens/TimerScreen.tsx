import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, AppStateStatus, FlatList, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Added AppStateStatus
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
// Corrected import path
import { cancelTimerNotification, sendTimerCompletionNotification, showTimerNotification } from '../services/NotificationService';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

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
  const appStateRef = useRef<AppStateStatus>(AppState.currentState); // Correctly typed
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null); // Added state for notification ID

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
      if (!timerEndTime) {
        setTimerEndTime(Date.now() + timeLeft * 1000);
      }

      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime % 15 === 0 || newTime < 10) {
            (async () => {
              if (currentNotificationId) { // Cancel previous before showing new
                await cancelTimerNotification(currentNotificationId);
              }
              const title = `${timerMode === 'pomodoro' ? (selectedTask?.title || 'Focus') : (timerMode === 'shortBreak' ? 'Short Break' : 'Long Break')} Timer`;
              const body = `Time remaining: ${formatTime(newTime)}`;
              const newNotificationId = await showTimerNotification(title, body);
              if (newNotificationId) {
                setCurrentNotificationId(newNotificationId);
              }
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
  }, [isRunning, timeLeft, timerMode, selectedTask, currentNotificationId]); // Added dependencies

  const handleTimerComplete = useCallback(async () => {
    console.log('handleTimerComplete called. Current timerMode:', timerMode, 'isRunning state variable before setIsRunning(false): ', isRunning);
    setIsRunning(false);
    setTimerEndTime(null);

    await unregisterTimerBackgroundTask();
    await clearTimerState();
    console.log('handleTimerComplete: Background task unregistered and timer state cleared.');

    if (currentNotificationId) {
      await cancelTimerNotification(currentNotificationId);
      setCurrentNotificationId(null);
    }

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
        setTimerMode(initialTimerMode);
        setCurrentNotificationId(state.notificationId || null); // Restore notificationId

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

    const handleAppStateChange = async (nextAppState: AppStateStatus) => { // Correctly typed
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
            notificationId: currentNotificationId, // Save notificationId
          });
          await registerTimerBackgroundTask();
          console.log('Background: Timer state saved and background task registered.');
        } else if (!isRunning && timeLeft > 0) { // Timer is paused with time left
          console.log('Background: Saving paused timer state');
          await initializeTimerState({
            endTime: null,
            timeLeft,
            isRunning: false,
            timerMode,
            taskTitle: selectedTask?.title,
            notificationId: currentNotificationId, // Save notificationId
          });
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
        if (currentNotificationId) { // Cancel previous before showing new
          await cancelTimerNotification(currentNotificationId);
        }
        const title = `${timerMode === 'pomodoro' ? (selectedTask?.title || 'Focus') : (timerMode === 'shortBreak' ? 'Short Break' : 'Long Break')} Timer`;
        const body = `Time remaining: ${formatTime(timeLeft)}`;
        const newNotificationId = await showTimerNotification(title, body);
        if (newNotificationId) {
          setCurrentNotificationId(newNotificationId);
        }
      })();
    } else if (!isRunning) {
      (async () => {
        console.log('NotificationEffect: Timer is not running. Cancelling notification.');
        if (currentNotificationId) {
          await cancelTimerNotification(currentNotificationId);
          setCurrentNotificationId(null);
        }
      })();
    }
  }, [isRunning, timerMode, selectedTask, timeLeft]); // Added timeLeft

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
      // Show notification when timer starts/resumes
      if (currentNotificationId) { await cancelTimerNotification(currentNotificationId); }
      const title = `${timerMode === 'pomodoro' ? (selectedTask?.title || 'Focus') : (timerMode === 'shortBreak' ? 'Short Break' : 'Long Break')} Timer`;
      const body = `Time remaining: ${formatTime(timeLeft)}`;
      const newNotificationId = await showTimerNotification(title, body);
      setCurrentNotificationId(newNotificationId);

      await initializeTimerState({
        endTime: currentTimerEndTime!,
        timeLeft,
        isRunning: true,
        timerMode,
        taskTitle: selectedTask?.title,
        notificationId: newNotificationId, // Save new notificationId
      });
      await registerTimerBackgroundTask();
    } else {
      // Timer is being paused
      console.log(`toggleTimer: Pausing. timeLeft: ${timeLeft}`);
      setTimerEndTime(null);
      await unregisterTimerBackgroundTask();
      if (currentNotificationId) {
        await cancelTimerNotification(currentNotificationId);
        setCurrentNotificationId(null);
      }
      await initializeTimerState({
        endTime: null,
        timeLeft,
        isRunning: false,
        timerMode,
        taskTitle: selectedTask?.title,
        notificationId: null, // Clear notificationId when paused
      });
      console.log('toggleTimer: Paused state saved to AsyncStorage.');
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    setTimerEndTime(null);
    if (currentNotificationId) {
      await cancelTimerNotification(currentNotificationId);
      setCurrentNotificationId(null);
    }
    await unregisterTimerBackgroundTask();
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

  const skipTimer = async () => {
    setIsRunning(false);
    setTimerEndTime(null);
    if (currentNotificationId) {
      await cancelTimerNotification(currentNotificationId);
      setCurrentNotificationId(null);
    }
    // Determine next timer mode
    if (completedPomodoros < settings.longBreakInterval) {
      setTimerMode('shortBreak');
      console.log('skipTimer: Switched to shortBreak mode.');
    } else {
      setTimerMode('longBreak');
      console.log('skipTimer: Switched to longBreak mode, reset completed pomodoros.');
    }
    // Reset timeLeft to new mode's duration
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
  };

  const selectTask = (task: any) => {
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
    alignItems: 'center',
    justifyContent: 'space-between', // Adjusted for better layout
    padding: 20,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20, // Added margin
  },
  modeButton: {
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 15, // Increased padding
    borderRadius: 20, // Rounded corners
  },
  modeButtonText: {
    fontSize: 16, // Slightly larger text
    fontWeight: 'bold', // Bold text
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Allow timer to take more space
  },
  taskInfoContainer: {
    alignItems: 'center',
    marginBottom: 20, // Added margin
  },
  taskText: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    marginBottom: 5, // Spacing
  },
  noTaskText: {
    fontSize: 16,
    fontStyle: 'italic', // Italic for placeholder
  },
  selectTaskButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  selectTaskButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out controls
    alignItems: 'center',
    marginBottom: 30, // Margin at the bottom
  },
  controlButton: {
    padding: 15, // Uniform padding
    borderRadius: 30, // Circular buttons
    marginHorizontal: 10, // Spacing between buttons
  },
  // Removed startButton as it's covered by controlButton with dynamic styling
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '90%', // Responsive width
    maxHeight: '80%', // Max height
    padding: 20,
    borderRadius: 10, // Rounded corners
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20, // Larger title
    fontWeight: 'bold',
    marginBottom: 15, // Spacing
    textAlign: 'center', // Center title
  },
  closeButton: {
    alignSelf: 'flex-end', // Position close button
    padding: 5,
  },
  // Added styles for ProgressRing and TaskSelectionItem if needed,
  // but assuming they have their own internal styling.
});

export default TimerScreen;