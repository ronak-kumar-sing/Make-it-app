import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { isUsingExpoGo } from './NotificationWarning';

/**
 * Collection of alternative notification approaches to work with Expo Go limitations
 */

/**
 * Standard notification setup - works for local notifications in Expo Go
 * but not for remote notifications on Android with SDK 53+
 */
export const setupStandardNotifications = () => {
  // Basic notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

/**
 * Send an immediate notification - works in both Expo Go and dev builds for local notifications
 */
export const sendImmediateNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Cannot send notifications on simulator/emulator');
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // null trigger means show immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return null;
  }
};

/**
 * Schedule a notification for a future time - works for local notifications
 * in Expo Go and dev builds
 */
export const scheduleDelayedNotification = async (
  title: string,
  body: string,
  delayInSeconds: number = 5,
  data: Record<string, any> = {}
): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Cannot schedule notifications on simulator/emulator');
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        seconds: delayInSeconds,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling delayed notification:', error);
    return null;
  }
};

/**
 * Alternative approach: In-app notification when push notifications aren't available
 * This simulates a notification using an Alert when the app is in the foreground
 */
export const showInAppNotification = (title: string, message: string) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK' }],
    { cancelable: true }
  );
};

/**
 * Hook to listen for app state changes as an alternative notification trigger
 * This can be used to check for updates when the app returns to the foreground
 */
export const useAppStateListener = (callback: () => void) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        callback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
};

/**
 * Schedule a calendar-based notification - more reliable for specific dates
 */
export const scheduleCalendarNotification = async (
  title: string,
  body: string,
  date: Date,
  data: Record<string, any> = {}
): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Cannot schedule notifications on simulator/emulator');
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Extract time components
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        // Use date instead of seconds for more precise scheduling
        year: date.getFullYear(),
        month: date.getMonth() + 1, // months are 0-indexed in JS but 1-indexed in expo-notifications
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats: false,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling calendar notification:', error);
    return null;
  }
};

/**
 * For recurring notifications - works for local notifications
 */
export const scheduleRecurringNotification = async (
  title: string,
  body: string,
  hour: number,
  minute: number,
  data: Record<string, any> = {}
): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Cannot schedule notifications on simulator/emulator');
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Schedule a recurring daily notification at the specified time
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        hour,
        minute,
        repeats: true, // This makes it recurring daily
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling recurring notification:', error);
    return null;
  }
};

/**
 * Special case: Fallback notification system for platforms with limitations
 */
export const createFallbackNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  // On Android in Expo Go, remote notifications don't work with SDK 53+
  if (Platform.OS === 'android' && isUsingExpoGo()) {
    // Use in-app notification as fallback
    showInAppNotification(title, body);
    return 'in-app-fallback';
  } else {
    // Use standard notification when available
    return sendImmediateNotification(title, body, data);
  }
};

/**
 * Clear all notifications
 */
export const dismissAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Set badge count (iOS only)
 */
export const setBadgeCount = async (count: number) => {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
};

/**
 * Listen for notification received (when app is in foreground)
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Listen for notification response (when user taps notification)
 */
export const addNotificationResponseReceivedListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Added default export to satisfy React Navigation
export default {};
