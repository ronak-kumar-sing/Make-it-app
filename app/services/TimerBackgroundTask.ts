import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { cancelTimerNotification, sendTimerCompletionNotification, showTimerNotification } from './TimerNotification';

// Constants
export const TIMER_BACKGROUND_TASK = 'TIMER_BACKGROUND_TASK';
const TIMER_STATE_KEY = 'timerState';

// Types
interface TimerState {
  endTime: number;
  timeLeft: number;
  isRunning: boolean;
  timerMode: string;
  taskTitle?: string;
  lastUpdateTime: number;
}

// Initialize the timer state in AsyncStorage
export const initializeTimerState = async (timerState: Omit<TimerState, 'lastUpdateTime'>) => {
  try {
    const state: TimerState = {
      ...timerState,
      lastUpdateTime: Date.now()
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
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Calculate time passed since last update
    const now = Date.now();
    const timePassed = Math.floor((now - timerState.lastUpdateTime) / 1000);
    const newTimeLeft = Math.max(0, timerState.timeLeft - timePassed);

    // Update timer state
    await updateTimerState({
      timeLeft: newTimeLeft,
      lastUpdateTime: now // lastUpdateTime is updated by updateTimerState itself
    });

    if (newTimeLeft <= 0) {
      // Timer completed
      // Update state to reflect completion, but don't clear it yet.
      // TimerScreen.handleTimerComplete will call clearTimerState.
      await updateTimerState({
        timeLeft: 0,
        isRunning: false,
        // endTime remains the same (past time)
        // lastUpdateTime will be updated by updateTimerState
      });
      await cancelTimerNotification(); // Cancel ongoing notification
      await sendTimerCompletionNotification(); // Send completion notification
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // Update notification
      await showTimerNotification(
        newTimeLeft,
        timerState.timerMode,
        timerState.isRunning,
        timerState.taskTitle
      );
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
