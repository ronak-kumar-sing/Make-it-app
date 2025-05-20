import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { cancelTimerNotification, sendTimerCompletionNotification, showTimerNotification } from './NotificationService';

// Constants
export const TIMER_BACKGROUND_TASK = 'TIMER_BACKGROUND_TASK';
const TIMER_STATE_KEY = 'timerState';

// Types
interface TimerState {
  endTime: number | null; // Allow null for paused state
  timeLeft: number;
  isRunning: boolean;
  timerMode: string;
  taskTitle?: string;
  lastUpdateTime: number;
  notificationId?: string | null; // Added to store active notification ID
}

// Initialize the timer state in AsyncStorage
export const initializeTimerState = async (timerState: Omit<TimerState, 'lastUpdateTime'>) => { // Omit notificationId if it's managed internally or passed differently
  try {
    const state: TimerState = {
      ...timerState,
      lastUpdateTime: Date.now(),
      // notificationId: timerState.notificationId || null, // Ensure it's part of the state if passed
    };
    await AsyncStorage.setItem('timerState', JSON.stringify(state));
  } catch (error) {
    console.error('Error initializing timer state:', error);
  }
};

// Get the current timer state from AsyncStorage
export const getTimerState = async (): Promise<TimerState | null> => {
  try {
    const stateStr = await AsyncStorage.getItem('timerState');
    return stateStr ? JSON.parse(stateStr) : null;
  } catch (error) {
    console.error('Error getting timer state:', error);
    return null;
  }
};

// Clear timer state from AsyncStorage
export const clearTimerState = async () => {
  try {
    await AsyncStorage.removeItem('timerState');
  } catch (error) {
    console.error('Error clearing timer state:', error);
  }
};

// Update timer state in AsyncStorage
export const updateTimerState = async (updates: Partial<TimerState>) => {
  try {
    const currentState = await getTimerState();
    if (currentState) {
      const newState = {
        ...currentState,
        ...updates,
        lastUpdateTime: Date.now()
      };
      await AsyncStorage.setItem('timerState', JSON.stringify(newState));
    }
  } catch (error) {
    console.error('Error updating timer state:', error);
  }
};

// Background task definition
TaskManager.defineTask(TIMER_BACKGROUND_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  try {
    const timerState = await getTimerState();
    if (!timerState || !timerState.isRunning) {
      // If no active timer state or timer is not running, cancel any lingering notification
      if (timerState?.notificationId) {
        await cancelTimerNotification(timerState.notificationId);
        await updateTimerState({ notificationId: null }); // Clear it from state
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Calculate time passed since last update
    const now = Date.now();
    const timePassed = Math.floor((now - timerState.lastUpdateTime) / 1000);
    const newTimeLeft = Math.max(0, timerState.timeLeft - timePassed);

    // Update timer state (including lastUpdateTime)
    await updateTimerState({
      timeLeft: newTimeLeft,
      // notificationId will be updated below if necessary
    });

    if (newTimeLeft <= 0) {
      // Timer completed
      await updateTimerState({
        timeLeft: 0,
        isRunning: false,
        notificationId: null, // Clear notification ID on completion
      });

      if (timerState.notificationId) {
        await cancelTimerNotification(timerState.notificationId); // Cancel ongoing notification
      }
      await sendTimerCompletionNotification(); // Send completion notification
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // Update notification
      // Cancel previous notification before showing a new one to prevent duplicates
      if (timerState.notificationId) {
        await cancelTimerNotification(timerState.notificationId);
      }
      const title = `${timerState.timerMode === 'pomodoro' ? (timerState.taskTitle || 'Focus') : (timerState.timerMode === 'shortBreak' ? 'Short Break' : 'Long Break')} Timer`;
      const body = `Time remaining: ${Math.floor(newTimeLeft / 60)}:${(newTimeLeft % 60).toString().padStart(2, '0')}`;
      const newNotificationId = await showTimerNotification(title, body);
      await updateTimerState({ notificationId: newNotificationId }); // Store new notification ID

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
  } catch (error) {
    console.error('Error in background timer task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background task
export const registerTimerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(TIMER_BACKGROUND_TASK, {
      minimumInterval: 30, // Update every 30 seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Timer background task registered');
  } catch (error) {
    console.error('Error registering timer background task:', error);
  }
};

// Unregister background task
export const unregisterTimerBackgroundTask = async () => {
  try {
    // Check if the task is registered before trying to unregister
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TIMER_BACKGROUND_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(TIMER_BACKGROUND_TASK);
      console.log('Timer background task unregistered');
    } else {
      console.log('Timer background task was not registered, no need to unregister.');
    }
  } catch (error) {
    console.error('Error unregistering timer background task:', error);
  }
};
