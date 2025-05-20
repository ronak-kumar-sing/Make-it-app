import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isUsingExpoGo, showNotificationLimitationsWarning } from './NotificationWarning';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // Required for iOS 14+
    shouldShowList: true, // Required for iOS 14+
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Register for background notifications on app start
const configurePushNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

// Call this function to ensure background notifications work
configurePushNotifications();

// Type definitions
type Task = {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  subject?: string;
  completed?: boolean;
  timerMinutes?: number; // Time set for this task
};

type Exam = {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  subject?: string;
  completed?: boolean;
};

// Notification types
export const NOTIFICATION_TYPES = {
  TASK_DUE: 'TASK_DUE',
  EXAM_REMINDER: 'EXAM_REMINDER',
  TIMER_COMPLETED: 'TIMER_COMPLETED',
};

// Check if device can receive notifications
export const areNotificationsAvailable = async () => {
  if (!Device.isDevice) {
    return false; // Cannot show notifications on simulator/emulator
  }

  // Show a warning if in Expo Go (only once per app launch)
  if (isUsingExpoGo() && Platform.OS === 'android') {
    showNotificationLimitationsWarning();
  }

  return true;
};

// Check notification permissions
export const checkPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return { status };
  } catch (err) {
    console.error('Error checking notification permissions:', err);
    return { status: 'denied', error: err };
  }
};

// Request permission for notifications
export const requestNotificationPermissions = async () => {
  // Check if we're on a real device
  if (!Device.isDevice) {
    return false;
  }

  // Check if we've requested permissions recently
  try {
    const lastRequest = await AsyncStorage.getItem('lastPermissionRequest');
    const now = new Date().getTime();

    // If we requested within the last 24 hours and were denied, don't ask again
    if (lastRequest) {
      const timeSinceLastRequest = now - parseInt(lastRequest);

      // Check current status without prompting
      const { status } = await Notifications.getPermissionsAsync();

      // If permission was denied within last 24 hours, don't prompt again
      if (status !== 'granted' && timeSinceLastRequest < 86400000) {
        console.log('Skipping permission request - asked recently');
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking last permission request time', error);
  }

  // Check existing status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  // If already granted, we're good
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;

    // Store when we last requested
    try {
      await AsyncStorage.setItem('lastPermissionRequest', new Date().getTime().toString());
    } catch (error) {
      console.error('Error storing permission request time', error);
    }
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Set up notification channels for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Create channels for different notification types
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Tasks',
      description: 'Notifications for task due dates',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('exams', {
      name: 'Exams',
      description: 'Notifications for exam reminders',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Timer',
      description: 'Notifications for timer sessions',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return true;
};

// Backward compatibility function for older components
export const requestPermissionsAsync = async () => {
  const result = await requestNotificationPermissions();
  return { status: result ? 'granted' : 'denied' };
};

// Schedule a task due notification
export const scheduleTaskDueNotification = async (task: Task) => {
  if (!task.dueDate) return null;

  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    const dueDate = new Date(task.dueDate);

    // Don't schedule if the date is in the past
    if (dueDate < new Date()) return null;

    // Cancel any existing notifications for this task
    await cancelTaskNotification(task.id);

    // Schedule notification for task due time
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due',
        body: `"${task.title}" is due now.`,
        data: {
          type: NOTIFICATION_TYPES.TASK_DUE,
          taskId: task.id,
          timerMinutes: task.timerMinutes
        },
        priority: 'high',
        sound: true
      },
      trigger: {
        date: dueDate,
        channelId: Platform.OS === 'android' ? 'tasks' : undefined,
      },
    });

    // Store notification ID for future reference
    await AsyncStorage.setItem(`taskNotification:${task.id}`, JSON.stringify({
      id: notificationId,
      scheduledFor: dueDate.toISOString(),
    }));

    console.log(`Task notification scheduled for "${task.title}" at ${dueDate.toLocaleString()}`);
    return notificationId;
  } catch (err) {
    console.error('Error scheduling task notification:', err);
    return null;
  }
};

// Cancel a task notification
export const cancelTaskNotification = async (taskId: string) => {
  try {
    const storedNotification = await AsyncStorage.getItem(`taskNotification:${taskId}`);
    if (storedNotification) {
      const notificationId = JSON.parse(storedNotification).id;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`taskNotification:${taskId}`);
    }

    // Also check for all scheduled notifications and cancel any with this taskId
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.taskId === taskId
    );

    for (const notification of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (err) {
    console.error('Error canceling task notification:', err);
  }
};

// Schedule an exam reminder notification for 5 AM
export const scheduleExamReminder = async (exam: Exam) => {
  if (!exam.date) return null;

  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    const examDate = new Date(exam.date);

    // Don't schedule if the date is in the past
    if (examDate < new Date()) return null;

    // Cancel any existing notifications for this exam
    await cancelExamReminders(exam.id);

    // Schedule notification for 5 AM on the exam day
    const examDayMorning = new Date(examDate);
    examDayMorning.setHours(5, 0, 0); // 5 AM on exam day

    if (examDayMorning > new Date()) {
      // Configure notification for high priority
      const morningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Exam Today',
          body: `Your "${exam.title}" exam is today.`,
          data: {
            type: NOTIFICATION_TYPES.EXAM_REMINDER,
            examId: exam.id
          },
          sound: true,
          priority: 'high',
        },
        trigger: {
          date: examDayMorning,
          channelId: Platform.OS === 'android' ? 'exams' : undefined,
        },
      });

      // Store the notification ID
      await AsyncStorage.setItem(`examNotification:${exam.id}`, JSON.stringify([
        { id: morningId, type: 'morning' }
      ]));

      console.log(`Exam notification scheduled for ${exam.title} at ${examDayMorning.toLocaleString()}`);
      return [{ id: morningId, type: 'morning' }];
    }

    return null;
  } catch (err) {
    console.error('Error scheduling exam notification:', err);
    return null;
  }
};

// Cancel exam notifications
export const cancelExamReminders = async (examId: string) => {
  try {
    const storedNotifications = await AsyncStorage.getItem(`examNotification:${examId}`);
    if (storedNotifications) {
      const notifications = JSON.parse(storedNotifications);
      for (const notification of notifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }
      await AsyncStorage.removeItem(`examNotification:${examId}`);
    }

    // Also check for all scheduled notifications and cancel any with this examId
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const examNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.examId === examId
    );

    for (const notification of examNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (err) {
    console.error('Error canceling exam notifications:', err);
  }
};

// Send an immediate notification when timer completes
export const sendTimerCompletionNotification = async (title = 'Timer Complete', body = 'Your study session is complete.') => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: NOTIFICATION_TYPES.TIMER_COMPLETED },
        priority: 'high',
        sound: true
      },
      trigger: null, // Immediate notification
    });
  } catch (err) {
    console.error('Error sending timer completion notification:', err);
  }
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Clear all stored notification IDs
    const keys = await AsyncStorage.getAllKeys();
    const notificationKeys = keys.filter(key =>
      key.startsWith('taskNotification:') ||
      key.startsWith('examNotification:')
    );

    if (notificationKeys.length > 0) {
      await AsyncStorage.multiRemove(notificationKeys);
    }
  } catch (err) {
    console.error('Error canceling all notifications:', err);
  }
};

// For Expo Push Notifications service (not used for local notifications)
export const registerForPushNotificationsAsync = async () => {
  console.log("Push notifications feature would need Expo push token setup");
};

// Add a listener for notification responses
export const addNotificationResponseReceivedListener = (callback: (response: Notifications.NotificationResponse) => void) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Check if specific notification type is enabled
export const isNotificationTypeEnabled = async (type: string) => {
  try {
    const settings = await AsyncStorage.getItem('notification_settings');
    if (!settings) return true; // Default to enabled if no settings

    const parsedSettings = JSON.parse(settings);

    switch (type) {
      case NOTIFICATION_TYPES.TASK_DUE:
        return parsedSettings.tasksDue !== false;
      case NOTIFICATION_TYPES.EXAM_REMINDER:
        return parsedSettings.exams !== false;
      case NOTIFICATION_TYPES.TIMER_COMPLETED:
        return parsedSettings.timerCompleted !== false;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification type settings:', error);
    return true; // Default to enabled on error
  }
};

// Initialize notifications system
export const initializeNotifications = async (
  notificationsEnabled: boolean,
  tasks: Task[] = [],
  exams: Exam[] = [],
) => {
  // If notifications are not enabled in settings, don't schedule any
  if (!notificationsEnabled) return;

  try {
    // Check permissions without showing a dialog on every initialization
    const { status } = await checkPermissions();

    if (status !== 'granted') {
      // Only try to request permissions if we haven't recently done so
      const lastRequest = await AsyncStorage.getItem('lastPermissionRequest');
      const now = new Date().getTime();

      if (!lastRequest || (now - parseInt(lastRequest)) > 86400000) {
        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) return;
      } else {
        // Skip if we've recently asked for permissions
        return;
      }
    }

    // Schedule notifications for upcoming tasks with due dates
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
          scheduleTaskDueNotification(task);
        }
      });
    }

    // Schedule notifications for upcoming exams
    if (exams.length > 0) {
      exams.forEach(exam => {
        if (!exam.completed && exam.date) {
          scheduleExamReminder(exam);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Added default export to satisfy React Navigation
export default {};
