import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isUsingExpoGo, showNotificationLimitationsWarning } from './NotificationWarning';
import { registerBackgroundNotificationHandler } from './BackgroundNotificationHandler';

// Define notification types
export const NOTIFICATION_TYPES = {
  TASK_DUE: 'TASK_DUE',
  TASK_REMINDER: 'TASK_REMINDER',
  EXAM_REMINDER: 'EXAM_REMINDER',
  TIMER_COMPLETED: 'TIMER_COMPLETED',
};

// Type definitions
type Task = {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  subject?: string;
  completed?: boolean;
  timerMinutes?: number;
};

type Exam = {
  id: string;
  title: string;
  date: string;
  description?: string;
  subject?: string;
  completed?: boolean;
};

// Configure foreground notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Utility function to create a time-based trigger
const createTrigger = (date: Date): Notifications.NotificationTriggerInput => ({
  type: 'timeInterval' as const,
  seconds: Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000)),
  repeats: false,
});

// Initialize notification channels for Android
const initializeAndroidChannels = async () => {
  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      }),
      Notifications.setNotificationChannelAsync('tasks', {
        name: 'Tasks',
        description: 'Task notifications and reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      }),
      Notifications.setNotificationChannelAsync('exams', {
        name: 'Exams',
        description: 'Exam reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      }),
      Notifications.setNotificationChannelAsync('timer', {
        name: 'Timer',
        description: 'Timer notifications',
        importance: Notifications.AndroidImportance.HIGH,
        enableLights: true,
        enableVibrate: true,
        vibrationPattern: [0, 500, 250, 500],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      }),
      Notifications.setNotificationChannelAsync('persistent', {
        name: 'Persistent',
        description: 'Ongoing notifications that stay visible',
        importance: Notifications.AndroidImportance.HIGH,
        enableLights: false,
        enableVibrate: false,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
    ]);
  }
};

// Check if device supports notifications
export const areNotificationsAvailable = async () => {
  if (!Device.isDevice) {
    return false;
  }
  if (isUsingExpoGo() && Platform.OS === 'android') {
    showNotificationLimitationsWarning();
  }
  return true;
};

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem('lastPermissionRequest', Date.now().toString());
      return status === 'granted';
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule a task notification
export const scheduleTaskNotification = async (task: Task, reminderMinutes: number = 5) => {
  if (!task.dueDate) return null;

  try {
    const dueDate = new Date(task.dueDate);
    if (dueDate <= new Date()) return null;

    await cancelTaskNotification(task.id);

    const notificationIds = [];

    // Schedule reminder notification
    if (reminderMinutes > 0) {
      const reminderTime = new Date(dueDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

      if (reminderTime > new Date()) {
        const reminderId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${task.title}`,
            body: `Task due in ${reminderMinutes} minutes`,
            data: {
              type: NOTIFICATION_TYPES.TASK_REMINDER,
              taskId: task.id,
            },
            sound: true,
          },
          trigger: createTrigger(reminderTime),
        });

        notificationIds.push({ id: reminderId, type: 'reminder' });
      }
    }

    // Schedule due notification
    const dueId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due',
        body: `${task.title} is due now`,
        data: {
          type: NOTIFICATION_TYPES.TASK_DUE,
          taskId: task.id,
        },
        sound: true,
      },
      trigger: createTrigger(dueDate),
    });

    notificationIds.push({ id: dueId, type: 'due' });
    await AsyncStorage.setItem(`taskNotification:${task.id}`, JSON.stringify(notificationIds));

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling task notification:', error);
    return null;
  }
};

// Schedule exam reminder
export const scheduleExamReminder = async (exam: Exam) => {
  if (!exam.date) return null;

  try {
    const examDate = new Date(exam.date);
    if (examDate <= new Date()) return null;

    await cancelExamReminder(exam.id);

    const morningTime = new Date(examDate);
    morningTime.setHours(5, 0, 0, 0);

    if (morningTime <= new Date()) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Exam Today',
        body: `${exam.title} exam is today`,
        data: {
          type: NOTIFICATION_TYPES.EXAM_REMINDER,
          examId: exam.id,
        },
        sound: true,
      },
      trigger: createTrigger(morningTime),
    });

    await AsyncStorage.setItem(`examNotification:${exam.id}`, JSON.stringify([{ id: notificationId }]));
    return [{ id: notificationId }];
  } catch (error) {
    console.error('Error scheduling exam reminder:', error);
    return null;
  }
};

// Cancel notifications
export const cancelTaskNotification = async (taskId: string) => {
  try {
    const stored = await AsyncStorage.getItem(`taskNotification:${taskId}`);
    if (stored) {
      const notifications = JSON.parse(stored);
      await Promise.all(
        notifications.map((n: { id: string }) =>
          Notifications.cancelScheduledNotificationAsync(n.id)
        )
      );
      await AsyncStorage.removeItem(`taskNotification:${taskId}`);
    }
  } catch (error) {
    console.error('Error canceling task notification:', error);
  }
};

export const cancelExamReminder = async (examId: string) => {
  try {
    const stored = await AsyncStorage.getItem(`examNotification:${examId}`);
    if (stored) {
      const notifications = JSON.parse(stored);
      await Promise.all(
        notifications.map((n: { id: string }) =>
          Notifications.cancelScheduledNotificationAsync(n.id)
        )
      );
      await AsyncStorage.removeItem(`examNotification:${examId}`);
    }
  } catch (error) {
    console.error('Error canceling exam reminder:', error);
  }
};

// Send immediate notifications
export const sendTimerCompletionNotification = async (title = 'Timer Complete', body = 'Study session complete') => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: NOTIFICATION_TYPES.TIMER_COMPLETED },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending timer completion notification:', error);
  }
};

// Initialize notifications system
export const initializeNotifications = async (
  enabled: boolean,
  tasks: Task[] = [],
  exams: Exam[] = [],
  reminderMinutes: number = 5
) => {
  if (!enabled) return;

  try {
    // Initialize background handler
    await registerBackgroundNotificationHandler();

    // Initialize Android channels
    await initializeAndroidChannels();

    // Check permissions
    if (!await requestNotificationPermissions()) return;

    // Schedule notifications
    const promises = [
      ...tasks
        .filter(t => !t.completed && t.dueDate)
        .map(t => scheduleTaskNotification(t, reminderMinutes)),
      ...exams
        .filter(e => !e.completed && e.date)
        .map(e => scheduleExamReminder(e)),
    ];

    await Promise.all(promises);
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

export default {
  initializeNotifications,
  scheduleTaskNotification,
  scheduleExamReminder,
  sendTimerCompletionNotification,
};
