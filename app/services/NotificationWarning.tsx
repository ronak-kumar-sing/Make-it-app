import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

/**
 * Utility to detect Expo Go and warn users about notification limitations
 * This addresses the warning: expo-notifications functionality is not fully supported in Expo Go with SDK 53+
 */
export const isUsingExpoGo = (): boolean => {
  // Check if the app is running in Expo Go
  return Constants.appOwnership === 'expo';
};

/**
 * Shows a warning alert about notification limitations in Expo Go
 */
export const showNotificationLimitationsWarning = () => {
  if (isUsingExpoGo()) {
    Alert.alert(
      'Notification Limitations',
      'Push notifications have limited functionality in Expo Go with SDK 53+. For full notification support, please use a development build.',
      [
        { text: 'Learn More', onPress: () => openDevBuildDocs() },
        { text: 'OK', style: 'default' }
      ]
    );
  }
};

/**
 * Opens the Expo documentation about development builds
 */
const openDevBuildDocs = () => {
  // Would typically use Linking.openURL here, but we're keeping this simple
  console.log('User would be directed to https://docs.expo.dev/develop/development-builds/introduction/');
};

/**
 * Checks if the current platform supports all notification features
 */
export const hasFullNotificationSupport = (): boolean => {
  // Android remote notifications aren't supported in Expo Go with SDK 53+
  if (Platform.OS === 'android' && isUsingExpoGo()) {
    return false;
  }

  // iOS may have different limitations but generally works better in Expo Go
  return true;
};

// Added default export to satisfy React Navigation
export default {};
