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
    shouldSetBadge: false,
  }),
});

// Type definitions
type Task = {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  subject?: string;
  completed?: boolean;
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
  DAILY_GOAL: 'DAILY_GOAL',
  STREAK_REMINDER: 'STREAK_REMINDER',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  WATER_REMINDER: 'WATER_REMINDER',
  ACTIVITY_REMINDER: 'ACTIVITY_REMINDER',
  SLEEP_REMINDER: 'SLEEP_REMINDER',
  MOOD_CHECK: 'MOOD_CHECK',
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
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Create additional channels for different notification types
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Tasks',
      description: 'Notifications for task due dates',
      importance: Notifications.AndroidImportance.HIGH,
    });

    await Notifications.setNotificationChannelAsync('exams', {
      name: 'Exams',
      description: 'Notifications for exam reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });

    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Timer',
      description: 'Notifications for timer sessions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('streaks', {
      name: 'Streaks',
      description: 'Notifications for streak maintenance',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements',
      description: 'Notifications for achievement unlocks',
      importance: Notifications.AndroidImportance.LOW,
    });

    // Health notification channels
    await Notifications.setNotificationChannelAsync('health', {
      name: 'Health Reminders',
      description: 'Notifications for health and wellness reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
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

    // Check if task notifications are enabled
    if (!(await isNotificationTypeEnabled(NOTIFICATION_TYPES.TASK_DUE))) {
      return null;
    }

    const dueDate = new Date(task.dueDate);

    // Don't schedule if the date is in the past
    if (dueDate < new Date()) return null;

    // Schedule notification 1 day before due date
    const notifyDate = new Date(dueDate);
    notifyDate.setDate(notifyDate.getDate() - 1);

    // If notification time is already in the past, schedule for soon
    if (notifyDate <= new Date()) {
      notifyDate.setTime(new Date().getTime() + 5 * 60 * 1000); // 5 minutes from now
    }

    // Check if this notification is already scheduled
    const storedNotification = await AsyncStorage.getItem(`taskNotification:${task.id}`);
    if (storedNotification) {
      const notificationId = JSON.parse(storedNotification).id;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due Tomorrow',
        body: `"${task.title}" is due tomorrow.`,
        data: { type: NOTIFICATION_TYPES.TASK_DUE, taskId: task.id },
      },
      trigger: {
        channelId: 'tasks',
        seconds: Math.floor((notifyDate.getTime() - new Date().getTime()) / 1000),
      },
    });

    // Store notification ID for future reference
    await AsyncStorage.setItem(`taskNotification:${task.id}`, JSON.stringify({
      id: notificationId,
      scheduledFor: notifyDate.toISOString(),
    }));

    // Also schedule a notification at the exact due time
    const exactDueId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due Now',
        body: `"${task.title}" is due now.`,
        data: { taskId: task.id },
      },
      trigger: {
        channelId: 'tasks',
        seconds: Math.floor((dueDate.getTime() - new Date().getTime()) / 1000),
      },
    });

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

// Schedule an exam reminder notification
export const scheduleExamReminder = async (exam: Exam) => {
  if (!exam.date) return null;

  try {
    // Check for Expo Go limitations on Android for push notifications
    if (Platform.OS === 'android' && isUsingExpoGo()) {
      console.log('Warning: Remote notifications are limited in Expo Go on Android');
      // Continue with local notifications which still work
    }

    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    const examDate = new Date(exam.date);

    // Don't schedule if the date is in the past
    if (examDate < new Date()) return null;

    // Schedule notification 1 day before exam
    const dayBeforeDate = new Date(examDate);
    dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
    dayBeforeDate.setHours(9, 0, 0); // 9 AM

    // If the notification time is already in the past, don't schedule
    const notificationIds = [];
    if (dayBeforeDate > new Date()) {
      const dayBeforeId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Exam Tomorrow',
          body: `Reminder: Your "${exam.title}" exam is tomorrow.`,
          data: { examId: exam.id },
        },
        trigger: {
          channelId: 'exams',
          seconds: Math.floor((dayBeforeDate.getTime() - new Date().getTime()) / 1000),
        },
      });
      notificationIds.push({ id: dayBeforeId, type: 'dayBefore' });
    }

    // Also schedule a notification on the morning of exam day
    const examDayMorning = new Date(examDate);
    examDayMorning.setHours(7, 0, 0); // 7 AM on exam day

    if (examDayMorning > new Date()) {
      const morningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Exam Today',
          body: `Your "${exam.title}" exam is today.`,
          data: { examId: exam.id },
        },
        trigger: {
          channelId: 'exams',
          seconds: Math.floor((examDayMorning.getTime() - new Date().getTime()) / 1000),
        },
      });
      notificationIds.push({ id: morningId, type: 'morning' });
    }

    if (notificationIds.length > 0) {
      await AsyncStorage.setItem(`examNotification:${exam.id}`, JSON.stringify(notificationIds));
    }

    return notificationIds.length > 0 ? notificationIds : null;
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

// Schedule a streak reminder if user hasn't studied today
export const scheduleStreakReminder = async (currentStreak: number) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // Cancel any existing streak reminders
    const existingReminder = await AsyncStorage.getItem('streakReminder');
    if (existingReminder) {
      const notificationId = JSON.parse(existingReminder).id;
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // Calculate tomorrow evening at 6 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Maintain Your Study Streak!',
        body: `Don't break your ${currentStreak}-day study streak. Add a study session today!`,
        data: { type: NOTIFICATION_TYPES.STREAK_REMINDER },
      },
      trigger: {
        channelId: 'streaks',
        seconds: Math.floor((tomorrow.getTime() - new Date().getTime()) / 1000),
      },
    });

    await AsyncStorage.setItem('streakReminder', JSON.stringify({
      id: notificationId,
      scheduledFor: tomorrow.toISOString(),
    }));

    return notificationId;
  } catch (err) {
    console.error('Error scheduling streak reminder:', err);
    return null;
  }
};

// Schedule a daily goal reminder if user is behind
export const scheduleDailyGoalReminder = async (currentMinutes: number, goalMinutes: number) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // If already reached goal, don't schedule
    if (currentMinutes >= goalMinutes) return null;

    // Calculate evening reminder (8 PM today)
    const evening = new Date();
    evening.setHours(20, 0, 0, 0);

    // If it's already past 8 PM, don't schedule
    if (evening < new Date()) return null;

    const remainingMinutes = goalMinutes - currentMinutes;
    const remainingHours = (remainingMinutes / 60).toFixed(1);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Study Goal Reminder',
        body: `You still need to study ${remainingHours} hours to reach your daily goal.`,
        data: { type: NOTIFICATION_TYPES.DAILY_GOAL },
      },
      trigger: {
        channelId: 'default',
        seconds: Math.floor((evening.getTime() - new Date().getTime()) / 1000),
      },
    });

    return notificationId;
  } catch (err) {
    console.error('Error scheduling daily goal reminder:', err);
    return null;
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
        data: { type: NOTIFICATION_TYPES.TIMER_COMPLETED }
      },
      trigger: null, // Immediate notification
    });
  } catch (err) {
    console.error('Error sending timer completion notification:', err);
  }
};

// Send an achievement notification
export const sendAchievementNotification = async (achievementName: string) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Achievement Unlocked! 🏆',
        body: `You've unlocked the "${achievementName}" achievement!`,
        data: { type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED },
      },
      trigger: null, // Immediate notification
    });
  } catch (err) {
    console.error('Error sending achievement notification:', err);
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
      key.startsWith('examNotification:') ||
      key === 'streakReminder' ||
      key === 'goalReminder'
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
      case NOTIFICATION_TYPES.STREAK_REMINDER:
        return parsedSettings.streakReminders !== false;
      case NOTIFICATION_TYPES.DAILY_GOAL:
        return parsedSettings.dailyGoals !== false;
      case NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED:
        return parsedSettings.achievements !== false;
      case NOTIFICATION_TYPES.WATER_REMINDER:
        return parsedSettings.waterReminders !== false;
      case NOTIFICATION_TYPES.ACTIVITY_REMINDER:
        return parsedSettings.activityReminders !== false;
      case NOTIFICATION_TYPES.SLEEP_REMINDER:
        return parsedSettings.sleepReminders !== false;
      case NOTIFICATION_TYPES.MOOD_CHECK:
        return parsedSettings.moodChecks !== false;
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
  streak: { current: number } = { current: 0 },
  dailyStudyMinutes: number = 0,
  dailyGoalMinutes: number = 120
) => {
  // Cancel any existing notifications first
  await cancelAllNotifications();

  // If notifications are not enabled in settings, don't schedule any
  if (!notificationsEnabled) return;

  // Check permissions
  const permissionGranted = await requestNotificationPermissions();
  if (!permissionGranted) return;

  // Schedule notifications for upcoming tasks
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

  // Schedule a streak reminder if there's an active streak
  if (streak.current > 0) {
    scheduleStreakReminder(streak.current);
  }

  // Schedule daily goal reminder if behind on daily goal
  if (dailyStudyMinutes < dailyGoalMinutes) {
    scheduleDailyGoalReminder(dailyStudyMinutes, dailyGoalMinutes);
  }
};

// Schedule a water intake reminder
export const scheduleWaterReminder = async (startHour = 9, endHour = 21) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // Check if water reminders are enabled
    if (!(await isNotificationTypeEnabled(NOTIFICATION_TYPES.WATER_REMINDER))) {
      return null;
    }

    // Cancel any existing water reminders
    const existingId = await AsyncStorage.getItem('waterReminder');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    // Schedule reminders every 2 hours during the day
    const now = new Date();
    const triggers = [];

    for (let hour = startHour; hour <= endHour; hour += 2) {
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hour, 0, 0, 0);

      // If time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      triggers.push(scheduledTime);
    }

    const notificationIds = [];

    for (const triggerTime of triggers) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Hydration Reminder',
          body: 'Staying hydrated improves cognitive function. Have you had water in the last hour?',
          data: {
            type: NOTIFICATION_TYPES.WATER_REMINDER,
            screen: 'NutritionTracker',
          },
          sound: 'default',
        },
        trigger: {
          date: triggerTime,
          repeats: true,
          channelId: 'health',
        },
      });

      notificationIds.push(id);
    }

    // Store the notification IDs for later cancellation
    await AsyncStorage.setItem('waterReminder', JSON.stringify(notificationIds));
    return notificationIds;

  } catch (err) {
    console.error('Error scheduling water reminder:', err);
    return null;
  }
};

// Schedule a movement break reminder for study sessions
export const scheduleActivityReminder = async (studyDuration = 25) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // Check if activity reminders are enabled
    if (!(await isNotificationTypeEnabled(NOTIFICATION_TYPES.ACTIVITY_REMINDER))) {
      return null;
    }

    // Cancel any existing activity reminders
    const existingId = await AsyncStorage.getItem('activityBreakReminder');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    // Schedule to trigger after the study duration
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏃‍♂️ Movement Break',
        body: `You've been studying for ${studyDuration} minutes. Take a quick activity break to recharge!`,
        data: {
          type: NOTIFICATION_TYPES.ACTIVITY_REMINDER,
          screen: 'ActivityTracker',
        },
        sound: 'default',
      },
      trigger: {
        seconds: studyDuration * 60,
        channelId: 'health',
      },
    });

    await AsyncStorage.setItem('activityBreakReminder', notificationId);
    return notificationId;
  } catch (err) {
    console.error('Error scheduling activity break reminder:', err);
    return null;
  }
};

// Schedule a bedtime reminder
export const scheduleSleepReminder = async (bedtimeHour = 22, bedtimeMinute = 0) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // Check if sleep reminders are enabled
    if (!(await isNotificationTypeEnabled(NOTIFICATION_TYPES.SLEEP_REMINDER))) {
      return null;
    }

    // Cancel any existing sleep reminders
    const existingId = await AsyncStorage.getItem('sleepReminder');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    // Schedule 30 minutes before bedtime
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(bedtimeHour, bedtimeMinute - 30, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '😴 Sleep Reminder',
        body: 'Time to wind down! Good sleep leads to better study sessions tomorrow.',
        data: {
          type: NOTIFICATION_TYPES.SLEEP_REMINDER,
          screen: 'SleepTracker',
        },
        sound: 'default',
      },
      trigger: {
        date: reminderTime,
        repeats: true,
        channelId: 'health',
      },
    });

    await AsyncStorage.setItem('sleepReminder', notificationId);
    return notificationId;
  } catch (err) {
    console.error('Error scheduling sleep reminder:', err);
    return null;
  }
};

// Schedule a mood check-in reminder
export const scheduleMoodCheckIn = async (hour = 18, minute = 0) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return null;

    // Check if mood check reminders are enabled
    if (!(await isNotificationTypeEnabled(NOTIFICATION_TYPES.MOOD_CHECK))) {
      return null;
    }

    // Cancel any existing mood check reminders
    const existingId = await AsyncStorage.getItem('moodCheckReminder');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    // Schedule for the specified time
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(hour, minute, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '😊 Mood Check-in',
        body: 'How are you feeling today? Track your mood to build awareness of your mental wellness.',
        data: {
          type: NOTIFICATION_TYPES.MOOD_CHECK,
          screen: 'MoodTracker',
        },
        sound: 'default',
      },
      trigger: {
        date: reminderTime,
        repeats: true,
        channelId: 'health',
      },
    });

    await AsyncStorage.setItem('moodCheckReminder', notificationId);
    return notificationId;
  } catch (err) {
    console.error('Error scheduling mood check reminder:', err);
    return null;
  }
};

// Initialize all health notifications
export const initializeHealthNotifications = async (healthNotificationsEnabled = true) => {
  if (!healthNotificationsEnabled) return;

  const permissionGranted = await requestNotificationPermissions();
  if (!permissionGranted) return;

  // Schedule all health-related reminders
  await scheduleWaterReminder();
  await scheduleSleepReminder();
  await scheduleMoodCheckIn();
};

// Cancel all health-related notifications
export const cancelHealthNotifications = async () => {
  try {
    // Cancel water reminders
    const waterRemindersStr = await AsyncStorage.getItem('waterReminder');
    if (waterRemindersStr) {
      const waterReminderIds = JSON.parse(waterRemindersStr);
      for (const id of waterReminderIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await AsyncStorage.removeItem('waterReminder');
    }

    // Cancel activity break reminders
    const activityBreakId = await AsyncStorage.getItem('activityBreakReminder');
    if (activityBreakId) {
      await Notifications.cancelScheduledNotificationAsync(activityBreakId);
      await AsyncStorage.removeItem('activityBreakReminder');
    }

    // Cancel sleep reminders
    const sleepReminderId = await AsyncStorage.getItem('sleepReminder');
    if (sleepReminderId) {
      await Notifications.cancelScheduledNotificationAsync(sleepReminderId);
      await AsyncStorage.removeItem('sleepReminder');
    }

    // Cancel mood check reminders
    const moodCheckId = await AsyncStorage.getItem('moodCheckReminder');
    if (moodCheckId) {
      await Notifications.cancelScheduledNotificationAsync(moodCheckId);
      await AsyncStorage.removeItem('moodCheckReminder');
    }

    console.log('All health notifications cancelled');
    return true;
  } catch (err) {
    console.error('Error cancelling health notifications:', err);
    return false;
  }
};
