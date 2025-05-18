import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isUsingExpoGo } from '../services/NotificationWarning';
import { showInAppAlert } from '../utils/SimpleNotificationHelper';

interface SimpleNotificationExampleProps {
  theme: any;
}

const SimpleNotificationExample: React.FC<SimpleNotificationExampleProps> = ({ theme }) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [isExpoGoApp, setIsExpoGoApp] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    // Check permissions and environment on mount
    checkPermissions();
    setIsExpoGoApp(isUsingExpoGo());

    // Set up notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  const checkPermissions = async () => {
    if (!Device.isDevice) {
      setPermissionGranted(false);
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  };

  const requestPermissions = async () => {
    if (!Device.isDevice) {
      showInAppAlert('Cannot Request', 'Notifications are not available in simulators or emulators.');
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    setLastAction(`Permission request result: ${status}`);
  };

  const sendImmediateNotification = async () => {
    try {
      // The standard approach from your example
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a local notification test',
        },
        trigger: null, // Show immediately
      });

      setLastAction('Sent notification using standard method');
    } catch (error) {
      console.error('Error sending notification:', error);
      setLastAction(`Error: ${error.message}`);
    }
  };

  const sendAlternativeNotification = async () => {
    try {
      // Platform-specific handling
      if (Platform.OS === 'android' && isExpoGoApp) {
        // For Android in Expo Go, use in-app alert
        showInAppAlert('Test Notification', 'This is an in-app notification alternative');
        setLastAction('Showed in-app notification (Android Expo Go)');
      } else {
        // For iOS or development builds, use regular notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Test Notification',
            body: 'This is a local notification test using the alternative approach',
          },
          trigger: {
            seconds: 1, // Small delay to ensure it works
          },
        });
        setLastAction('Sent notification using alternative method');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setLastAction(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Simple Notification Example</Text>

      <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Permission Status: {permissionGranted ? 'Granted' : 'Not Granted'}
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Environment: {isExpoGoApp ? 'Expo Go' : 'Development Build'}
        </Text>
        {isExpoGoApp && Platform.OS === 'android' && (
          <Text style={[styles.warningText, { color: theme.danger }]}>
            ⚠️ Remote notifications limited in Expo Go on Android with SDK 53+
          </Text>
        )}
      </View>

      {!permissionGranted && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={requestPermissions}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={sendImmediateNotification}
          disabled={!permissionGranted && Device.isDevice}
        >
          <Text style={styles.buttonText}>Standard Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.success }]}
          onPress={sendAlternativeNotification}
        >
          <Text style={styles.buttonText}>Alternative Approach</Text>
        </TouchableOpacity>
      </View>

      {lastAction && (
        <View style={[styles.resultBox, { backgroundColor: `${theme.primary}20` }]}>
          <Text style={[styles.resultText, { color: theme.text }]}>{lastAction}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  buttonsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resultBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  resultText: {
    fontSize: 14,
  }
});

export default SimpleNotificationExample;
