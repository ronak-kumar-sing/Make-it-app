import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// Define task type interface with better type safety
interface Task {
  id: string;
  title: string;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  subject?: string;
  progress?: number;
  [key: string]: any; // For other properties we might not be directly using in this service
}

// Define settings interface with better type safety
interface Settings {
  autoArchive: boolean;
  archiveDays: number;
  taskRetentionWeeks: number;
  notifications?: boolean;
  [key: string]: any; // For other properties we might not be directly using in this service
}

// Define archive log type
interface ArchiveLog {
  timestamp: string;
  archived: number;
  deleted: number;
}

/**
 * Archive Task Process:
 * 1. Tasks must be completed for at least 24 hours before they're considered for archiving
 * 2. After the 24h grace period, tasks are archived if:
 *    - They were completed more than 'archiveDays' days ago, OR
 *    - They are past due (due date is in the past) and completed for >24h
 */

// Define the background task name
export const ARCHIVE_TASK_NAME = 'background-archive-task';

/**
 * Helper to safely parse dates
 * @param dateString Date string to parse
 * @param taskId Task ID for logging
 * @param fieldName Date field name for logging
 * @returns Valid Date object or null
 */
function safeParseDate(dateString: string | undefined, taskId: string, fieldName: string): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    // Validate the date is not Invalid Date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid ${fieldName} date for task ${taskId}: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.warn(`Error parsing ${fieldName} date for task ${taskId}: ${error}`);
    return null;
  }
}

// Task to archive old completed tasks
TaskManager.defineTask(ARCHIVE_TASK_NAME, async () => {
  try {
    console.log('Running background archive task');

    // Load necessary data from AsyncStorage
    const [tasksData, settingsData] = await Promise.all([
      AsyncStorage.getItem('tasks'),
      AsyncStorage.getItem('settings'),
    ]);

    if (!tasksData || !settingsData) {
      console.log('No tasks or settings data found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const tasks = JSON.parse(tasksData) as Task[];
    const settings = JSON.parse(settingsData) as Settings;

    // Check if auto-archive is enabled
    if (!settings.autoArchive) {
      console.log('Auto-archive is disabled');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const now = new Date();
    const { updatedTasks, archiveCount, deletionCount } = processTasks(tasks, settings);

    // Save updated tasks if any changes were made
    if (archiveCount > 0 || deletionCount > 0) {
      console.log(`Archived ${archiveCount} tasks, deleted ${deletionCount} old tasks`);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));

      // Show a notification if any tasks were archived
      if (archiveCount > 0 && settings.notifications !== false) {
        await notifyTasksArchived(archiveCount);
      }

      // Save a log of the archive operation
      const archiveLog = {
        timestamp: now.toISOString(),
        archived: archiveCount,
        deleted: deletionCount
      };

      const archiveLogsString = await AsyncStorage.getItem('archiveLogs');
      const archiveLogs = archiveLogsString ? JSON.parse(archiveLogsString) : [];
      archiveLogs.push(archiveLog);

      // Keep only the last 10 logs
      const trimmedLogs = archiveLogs.slice(-10);
      await AsyncStorage.setItem('archiveLogs', JSON.stringify(trimmedLogs));

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error: unknown) {
    console.error('Error in background archive task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Show notification when tasks are archived
 */
const notifyTasksArchived = async (count: number): Promise<void> => {
  try {
    // Check if we're on a real device
    if (Platform.OS === 'web') return;

    // Check if notification permissions are granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted, skipping archive notification');
      return;
    }

    // Show a notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tasks Archived',
        body: `${count} completed ${count === 1 ? 'task has' : 'tasks have'} been automatically archived.`,
        data: { type: 'archive_notification' },
        sound: true,
        badge: 1,
      },
      trigger: null, // Send immediately
    }).catch(err => {
      console.warn('Failed to schedule archive notification:', err);
    });
  } catch (error: unknown) {
    console.error('Failed to show archive notification:', error);
  }
};

// Register the background task
export const registerArchiveBackgroundTask = async (): Promise<boolean> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);
    if (isRegistered) {
      console.log('Archive background task already registered');
      return true;
    }

    // Register the task to run every day (minimum interval possible is 15 minutes)
    await BackgroundFetch.registerTaskAsync(ARCHIVE_TASK_NAME, {
      minimumInterval: 60 * 60, // Run at most once per hour
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('Archive background task registered');
    return true;
  } catch (error: unknown) {
    console.error('Error registering archive background task:', error);
    return false;
  }
};

// Unregister the background task
export const unregisterArchiveBackgroundTask = async (): Promise<boolean> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ARCHIVE_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(ARCHIVE_TASK_NAME);
      console.log('Archive background task unregistered');
    }
    return true;
  } catch (error: unknown) {
    console.error('Error unregistering archive background task:', error);
    return false;
  }
};

/**
 * Process tasks for archiving
 * @param tasks Array of tasks
 * @param settings Application settings
 * @returns Object with processed tasks and counts
 */
function processTasks(tasks: Task[], settings: Settings): {
  updatedTasks: Task[],
  archiveCount: number,
  deletionCount: number
} {
  const now = new Date();

  // Calculate archive threshold date based on settings
  const archiveThreshold = new Date();
  archiveThreshold.setDate(now.getDate() - settings.archiveDays);

  // Calculate retention threshold date based on settings
  const retentionThreshold = new Date();
  retentionThreshold.setDate(now.getDate() - (settings.taskRetentionWeeks * 7));

  let archiveCount = 0;
  let deletionCount = 0;

  // Process tasks
  const updatedTasks = tasks
    .filter(task => {
      // Remove tasks that are older than retention period
      const taskDate = safeParseDate(
        task.completedAt || task.createdAt,
        task.id,
        'retention'
      );

      if (task.archived && taskDate && taskDate < retentionThreshold) {
        deletionCount++;
        return false; // Filter out (delete) tasks older than retention period
      }
      return true;
    })
    .map(task => {
      // Archive completed tasks older than archive threshold
      // or completed tasks that are past their due date
      const taskDate = safeParseDate(task.completedAt, task.id, 'completedAt');
      const dueDate = safeParseDate(task.dueDate, task.id, 'dueDate');
      const isPastDue = dueDate && dueDate <= now;

      // Set one-day grace period threshold (24 hours)
      const oneDayThreshold = new Date();
      oneDayThreshold.setDate(now.getDate() - 1); // One day ago

      // Only archive if completed for at least one day
      if (task.completed && !task.archived && taskDate) {
        // First check if task has been completed for at least one day
        if (taskDate < oneDayThreshold) {
          // Then check if it meets other archiving criteria
          if (taskDate < archiveThreshold || isPastDue) {
            archiveCount++;
            return { ...task, archived: true };
          }
        }
      }
      return task;
    });

  return { updatedTasks, archiveCount, deletionCount };
}

// Run the archive task manually
export const runArchiveTaskManually = async (): Promise<{ archived: number; deleted: number; error?: string }> => {
  try {
    // Load necessary data from AsyncStorage
    const [tasksData, settingsData] = await Promise.all([
      AsyncStorage.getItem('tasks'),
      AsyncStorage.getItem('settings'),
    ]);

    if (!tasksData || !settingsData) {
      console.log('No tasks or settings data found');
      return { archived: 0, deleted: 0 };
    }

    const tasks = JSON.parse(tasksData) as Task[];
    const settings = JSON.parse(settingsData) as Settings;

    const { updatedTasks, archiveCount, deletionCount } = processTasks(tasks, settings);

    // Save updated tasks if any changes were made
    if (archiveCount > 0 || deletionCount > 0) {
      console.log(`Manually archived ${archiveCount} tasks, deleted ${deletionCount} old tasks`);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));

      // Show a notification if any tasks were archived
      if (archiveCount > 0 && settings.notifications !== false) {
        await notifyTasksArchived(archiveCount);
      }
    }

    return { archived: archiveCount, deleted: deletionCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in manual archive task:', error);
    return { archived: 0, deleted: 0, error: errorMessage };
  }
};

/**
 * Get archive logs
 * @returns Array of archive logs
 */
export const getArchiveLogs = async (): Promise<ArchiveLog[]> => {
  try {
    const archiveLogsString = await AsyncStorage.getItem('archiveLogs');
    if (!archiveLogsString) return [];

    return JSON.parse(archiveLogsString) as ArchiveLog[];
  } catch (error) {
    console.error('Error getting archive logs:', error);
    return [];
  }
};

/**
 * Clear archive logs
 */
export const clearArchiveLogs = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem('archiveLogs');
    return true;
  } catch (error) {
    console.error('Error clearing archive logs:', error);
    return false;
  }
};

/**
 * Get tasks that will soon be archived
 * @param tasks Array of tasks
 * @param settings Application settings
 * @returns Array of task IDs that will be archived soon
 */
export const getTasksToBeArchivedSoon = (tasks: Task[], settings: Settings): string[] => {
  if (!settings.autoArchive) return [];

  const now = new Date();

  // Set one-day grace period threshold (24 hours)
  const oneDayThreshold = new Date();
  oneDayThreshold.setDate(now.getDate() - 1); // One day ago

  return tasks
    .filter(task => {
      if (!task.completed || task.archived) return false;

      const completedDate = safeParseDate(task.completedAt, task.id, 'completedAt');
      if (!completedDate) return false;

      // If task has been completed less than 24 hours ago, but more than 20 hours,
      // notify user that it will be archived soon
      const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff >= 20 && hoursDiff < 24;
    })
    .map(task => task.id);
};
