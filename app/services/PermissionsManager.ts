/**
 * PermissionsManager.ts
 * A centralized service to manage all permissions needed by the app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

// Storage key for tracking if we've already asked for all permissions
const PERMISSIONS_REQUESTED_KEY = 'permissions_requested';

/**
 * Interface for permission status
 */
export interface PermissionStatuses {
  notifications: boolean;
  mediaLibrary: boolean;
  photoLibrary: boolean;
}

/**
 * Check if we've already asked for all permissions
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
 * Mark that we've asked for all permissions
 */
export const markPermissionsRequested = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
  } catch (error) {
    console.error('Error setting permissions status:', error);
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Request media library permissions for storage access
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
};

/**
 * Request photo library permissions
 */
export const requestPhotoLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting photo library permissions:', error);
    return false;
  }
};

/**
 * Check all permission statuses
 */
export const checkAllPermissions = async (): Promise<PermissionStatuses> => {
  const notificationStatus = Device.isDevice
    ? (await Notifications.getPermissionsAsync()).status === 'granted'
    : false;

  const mediaLibraryStatus = (await MediaLibrary.getPermissionsAsync()).status === 'granted';
  const photoLibraryStatus = (await ImagePicker.getMediaLibraryPermissionsAsync()).status === 'granted';

  return {
    notifications: notificationStatus,
    mediaLibrary: mediaLibraryStatus,
    photoLibrary: photoLibraryStatus
  };
};

/**
 * Request all permissions at once
 * Returns an object with the status of each permission
 */
export const requestAllPermissions = async (): Promise<PermissionStatuses> => {
  // Mark that we've asked for all permissions
  await markPermissionsRequested();

  const notificationGranted = await requestNotificationPermissions();
  const mediaLibraryGranted = await requestMediaLibraryPermissions();
  const photoLibraryGranted = await requestPhotoLibraryPermissions();

  return {
    notifications: notificationGranted,
    mediaLibrary: mediaLibraryGranted,
    photoLibrary: photoLibraryGranted
  };
};

/**
 * Show alert when permissions are denied
 * With an option to open settings
 */
export const showPermissionsDeniedAlert = (
  permissionType: string,
  message: string = 'Some features might not work correctly without this permission.'
) => {
  Alert.alert(
    `${permissionType} Permission Required`,
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
 * Show initial permissions dialog explaining why we need permissions
 * Returns true if user agrees to continue
 */
export const showPermissionsIntroDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'App Permissions',
      'To provide the best experience, Make-it needs access to:\n\n• Notifications: For reminders about tasks and exams\n• Storage: For saving and sharing data\n• Photo Library: For adding images to your resources\n\nYou can manage these permissions anytime in settings.',
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
