import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { ARCHIVE_TASK_NAME } from './ArchiveService';
import * as PermissionsManager from './PermissionsManager';

/**
 * Registry of all background tasks in the app.
 * This helps prevent task name conflicts and provides a central place
 * to manage all background tasks.
 */
export const BACKGROUND_TASKS = {
  ARCHIVE: ARCHIVE_TASK_NAME,
  // Add more tasks here as needed
};

/**
 * Register background fetch task for auto archive
 * @returns Promise resolving to boolean indicating success
 */
export const registerAutoArchiveTask = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.log('Background tasks not supported on web');
    return false;
  }

  try {
    // Check if we have notification permissions for optimal background task operation
    const hasPermission = await PermissionsManager.hasBackgroundPermissions();

    if (!hasPermission) {
      console.log('Limited background task functionality - notification permissions not granted');
      // We'll still register the task but with awareness it may have limited functionality
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);

    if (isRegistered) {
      console.log('Auto-archive background task already registered');
      return true;
    }

    // Register the background fetch task with improved options
    await BackgroundFetch.registerTaskAsync(ARCHIVE_TASK_NAME, {
      minimumInterval: 60 * 60, // Check every hour (in seconds)
      stopOnTerminate: false,   // Continue working after app is closed
      startOnBoot: true,        // Start task when device boots
    });

    console.log('Registered auto-archive background task successfully');

    // Verify registration
    const isNowRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);
    if (!isNowRegistered) {
      console.warn('Task registration verification failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to register auto-archive background task:', error);
    return false;
  }
};

/**
 * Unregister the background fetch task
 * @returns Promise resolving to boolean indicating success
 */
export const unregisterAutoArchiveTask = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.log('Background tasks not supported on web');
    return true; // Return true on web since there's nothing to unregister
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(ARCHIVE_TASK_NAME);
      console.log('Unregistered auto-archive background task');

      // Verify the task was actually unregistered
      const stillRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);
      if (stillRegistered) {
        console.warn('Task unregistration verification failed');
        return false;
      }
    } else {
      console.log('No archive task registered, nothing to unregister');
    }
    return true;
  } catch (error) {
    console.error('Failed to unregister auto-archive background task:', error);
    return false;
  }
};

/**
 * Check if background fetch functionality is available on this device
 * @returns Promise resolving to boolean indicating availability
 */
export const isBackgroundFetchAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isAvailable = status === BackgroundFetch.BackgroundFetchStatus.Available;

    if (!isAvailable) {
      console.log(`Background fetch is not available, status: ${status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking background fetch availability:', error);
    return false;
  }
};

/**
 * Check if a specific task is currently registered
 * @param taskName Name of the task to check
 * @returns Promise resolving to boolean indicating if task is registered
 */
export const isTaskRegistered = async (taskName: string): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    return await TaskManager.isTaskRegisteredAsync(taskName);
  } catch (error) {
    console.error(`Error checking if task ${taskName} is registered:`, error);
    return false;
  }
};

/**
 * Get the next execution time for a background task
 * This is useful for debugging and providing user feedback
 * @param taskName Name of the task to check
 * @returns Promise resolving to Date object or null if not scheduled
 */
export const getNextExecutionTime = async (taskName: string): Promise<Date | null> => {
  if (Platform.OS === 'web') return null;

  try {
    const info = await BackgroundFetch.getTasksAsync();
    const task = info.registeredTasksInfo.find(t => t.identifier === taskName);

    if (!task) return null;

    // Note: this is only an approximation, actual execution times depend on OS scheduling
    const now = new Date();
    const nextRunTime = new Date(now.getTime() + (task.intervalMs || 3600000));

    return nextRunTime;
  } catch (error) {
    console.error(`Error getting next execution time for ${taskName}:`, error);
    return null;
  }
};
