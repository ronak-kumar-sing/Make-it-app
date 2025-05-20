/**
 * AndroidNotificationFixes.ts
 *
 * This utility provides workarounds for platform-specific notification issues
 * on Android devices.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Utility function to check if the device is running Android
 * @returns boolean - true if device is Android
 */
export const isAndroidDevice = () => {
  return Platform.OS === 'android';
};

/**
 * Creates required notification channels for Android
 * Android requires channels for different notification types
 */
export const setupAndroidNotificationChannels = async () => {
  if (!isAndroidDevice() || !Device.isDevice) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

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
      description: 'Notifications for study timer sessions',
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
  } catch (error) {
    console.error('Error setting up Android notification channels:', error);
  }
};

/**
 * Helper function to create a properly formatted trigger for Android
 * This avoids common issues with Android notifications not firing
 *
 * @param date Date to schedule notification for
 * @param channelId Optional channel ID (default: 'default')
 * @returns Notification trigger object compatible with Android
 */
export const createAndroidTrigger = (date: Date, channelId = 'default') => {
  if (!isAndroidDevice()) {
    return { date }; // On iOS, just use the date
  }

  // Calculate seconds from now
  const secondsFromNow = Math.max(
    1, // Minimum 1 second
    Math.floor((date.getTime() - new Date().getTime()) / 1000)
  );

  return {
    channelId,
    seconds: secondsFromNow,
  };
};

/**
 * Helper function to properly format notification content for Android
 * Ensures all required fields are present to avoid runtime errors
 */
export const formatAndroidNotificationContent = (
  title: string,
  body: string,
  data?: any
) => {
  return {
    title,
    body,
    data: data || {},
    // Android specific properties
    ...(isAndroidDevice() ? {
      priority: 'high',
      vibrate: [0, 250, 250, 250],
      color: '#FF231F7C',
    } : {}),
  };
};

/**
 * Call this function to initialize all Android-specific notification settings
 */
export const initializeAndroidNotifications = async () => {
  if (!isAndroidDevice() || !Device.isDevice) {
    return;
  }

  await setupAndroidNotificationChannels();
};

// Added default export to satisfy React Navigation
export default {};
