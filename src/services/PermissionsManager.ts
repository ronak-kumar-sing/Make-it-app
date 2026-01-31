/**
 * PermissionsManager.ts
 * A centralized service to manage permissions needed by the app.
 * Simplified to focus on notification permissions for core app functionality.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

// Storage key for tracking if we've already asked for permissions
const PERMISSIONS_REQUESTED_KEY = 'permissions_requested';
const LAST_PERMISSION_REQUEST_KEY = 'last_permission_request';

/**
 * Interface for permission status
 */
export interface PermissionStatuses {
  notifications: boolean;
}

/**
 * Check if we've already asked for permissions
 */
export const hasRequestedPermissions = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_REQUESTED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking permissions status:', error);
    return false;
  }
};

/**
 * Mark that we've asked for permissions
 */
export const markPermissionsRequested = async (): Promise<void> => {
  try {
    const now = new Date().getTime();
    await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
    await AsyncStorage.setItem(LAST_PERMISSION_REQUEST_KEY, now.toString());
  } catch (error) {
    console.error('Error setting permissions status:', error);
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.log('Not a physical device, skipping notification permission request');
    return false;
  }

  try {
    console.log('Requesting notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    console.log('Current notification permission status:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      // For Android 13+ (API 33+), explicitly request POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('Android 13+ detected, explicitly requesting POST_NOTIFICATIONS permission');
        const androidStatus = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        finalStatus = androidStatus === 'granted' ? 'granted' : 'denied';
      } else {
        // For older Android versions and iOS
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log('New notification permission status:', finalStatus);
    }

    // Record that we've requested permissions
    await markPermissionsRequested();

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if permission request is throttled (to prevent asking too frequently)
 */
export const isPermissionRequestThrottled = async (): Promise<boolean> => {
  try {
    const lastRequestTime = await AsyncStorage.getItem(LAST_PERMISSION_REQUEST_KEY);
    if (!lastRequestTime) return false;

    const now = new Date().getTime();
    const lastRequest = parseInt(lastRequestTime);

    // Don't request more than once per day (86400000 ms = 24h)
    return (now - lastRequest) < 86400000;
  } catch (error) {
    console.error('Error checking permission request throttle:', error);
    return false;
  }
};

/**
 * Checks if the app has background permissions for tasks like archiving
 */
export const hasBackgroundPermissions = async (): Promise<boolean> => {
  // For background tasks, we need notification permissions
  if (!Device.isDevice) return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking background permissions:', error);
    return false;
  }
};

/**
 * Check notification permission status
 */
export const checkNotificationPermission = async (): Promise<PermissionStatuses> => {
  const notificationStatus = Device.isDevice
    ? (await Notifications.getPermissionsAsync()).status === 'granted'
    : false;

  return {
    notifications: notificationStatus
  };
};

/**
 * Request notification permission if not already granted
 */
export const requestPermissionsIfNeeded = async (): Promise<PermissionStatuses> => {
  // Check if we've recently asked for permissions
  const isThrottled = await isPermissionRequestThrottled();

  // Get current permission status
  const currentStatus = await checkNotificationPermission();

  if (!currentStatus.notifications && !isThrottled) {
    // Mark that we've asked for permissions
    await markPermissionsRequested();

    // Request notification permission
    const notificationGranted = await requestNotificationPermissions();

    return {
      notifications: notificationGranted
    };
  }

  return currentStatus;
};

/**
 * Show alert when notification permission is denied
 * With an option to open settings
 */
export const showNotificationPermissionDeniedAlert = (
  message: string = 'Features like automatic task archiving and task reminders will not work without notification permissions.'
) => {
  Alert.alert(
    'Notification Permission Required',
    `${message} You can enable permissions in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          Linking.openSettings();
        }
      }
    ]
  );
};

/**
 * Show permissions dialog explaining why we need notification permissions
 * Returns true if user agrees to continue
 */
export const showNotificationPermissionsDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Notification Permissions',
      'Make-it needs notification permissions for:\n\n• Task due date reminders\n• Automatic archiving of completed tasks\n• Timer notifications when app is in background\n\nThese features will not work properly without notification permissions.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => resolve(false)
        },
        {
          text: 'Continue',
          onPress: () => resolve(true)
        }
      ]
    );
  });
};

/**
 * Request notification permissions with an explanatory dialog first
 */
export const requestNotificationPermissionsWithDialog = async (): Promise<boolean> => {
  const userAgreed = await showNotificationPermissionsDialog();

  if (userAgreed) {
    const granted = await requestNotificationPermissions();

    if (!granted) {
      // Show denied alert only if user agreed but permission was denied
      showNotificationPermissionDeniedAlert();
    }

    return granted;
  }

  return false;
};

// Export default for module compatibility
export default {
  requestNotificationPermissions,
  requestPermissionsIfNeeded,
  checkNotificationPermission,
  showNotificationPermissionDeniedAlert,
};
