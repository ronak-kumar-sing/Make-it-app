import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { NOTIFICATION_TYPES } from './NotificationService';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Define the background task for handling notifications
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody<any>) => {
  try {
    if (error) {
      console.error('Background notification task error:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Handle the notification in background
    if (data?.notification) {
      console.log('Received background notification:', data.notification);

      // Process the notification based on its type
      const notificationType = data.notification.request?.content?.data?.type;
      switch (notificationType) {
        case NOTIFICATION_TYPES.TASK_DUE:
          // Handle task due notification in background
          console.log('Processing task due notification in background');
          break;
        case NOTIFICATION_TYPES.EXAM_REMINDER:
          // Handle exam reminder notification in background
          console.log('Processing exam reminder notification in background');
          break;
        case NOTIFICATION_TYPES.TIMER_COMPLETED:
          // Handle timer completion notification in background
          console.log('Processing timer completion notification in background');
          break;
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Error in background notification task:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background notification handler
export const registerBackgroundNotificationHandler = async () => {
  if (Platform.OS === 'web') {
    console.log('Background notifications not supported on web');
    return false;
  }

  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);

    if (isRegistered) {
      console.log('Background notification task already registered');
      return true;
    }

    // Configure background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false, // Keep working after app is closed
      startOnBoot: true, // Start when device boots
    });

    // Verify registration
    const isNowRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isNowRegistered) {
      console.warn('Background notification task registration verification failed');
      return false;
    }

    console.log('Background notification task registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register background notification task:', error);
    return false;
  }
};
