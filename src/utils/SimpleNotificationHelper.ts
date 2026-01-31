import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { isUsingExpoGo } from '../services/NotificationWarning';

/**
 * Sets up the notification handler using the standard approach
 */
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false, // Reduced from original to avoid issues
      shouldSetBadge: false,
    }),
  });
};

/**
 * Simple function to send an immediate notification
 */
export const sendSimpleNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  try {
    // Check if we can send notifications
    if (!Device.isDevice) {
      console.log('Notifications not supported in simulator/emulator');
      return null;
    }

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Handle special case for Android in Expo Go
    if (Platform.OS === 'android' && isUsingExpoGo()) {
      // For Android in Expo Go with SDK 53+, show an in-app alert instead
      Alert.alert(
        title,
        body,
        [{ text: 'OK' }]
      );
      return 'in-app-alert';
    }

    // Standard notification approach - works for local notifications
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * Alternative: In-app notification approach for all environments
 * This is a guaranteed way to show notifications to users in any environment
 */
export const showInAppAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: 'OK' }]);
};

// Added default export to satisfy React Navigation
export default {};
