import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isUsingExpoGo } from '../services/NotificationWarning';

interface NotificationTesterProps {
  theme: any;
}

const NotificationTester: React.FC<NotificationTesterProps> = ({ theme }) => {
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isExpoGoEnvironment, setIsExpoGoEnvironment] = useState<boolean>(false);

  useEffect(() => {
    checkPermissions();
    setIsExpoGoEnvironment(isUsingExpoGo());

    // Set up notification listeners
    const receivedSubscription = addNotificationReceivedListener(notification => {
      setLastNotification(JSON.stringify(notification.request.content));
    });

    const responseSubscription = addNotificationResponseReceivedListener(response => {
      Alert.alert(
        'Notification tapped!',
        JSON.stringify(response.notification.request.content)
      );
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
  };

  // Send an immediate notification
  const sendImmediateNotification = async (
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.log('Cannot send notifications on simulator/emulator');
        return null;
      }

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

  // Schedule a notification with delay
  const scheduleDelayedNotification = async (
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
          type: 'timeInterval',
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      return null;
    }
  };

  // Schedule a calendar notification with correct type
  const scheduleCalendarNotification = async (
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
          type: 'calendar',
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

  // Schedule a recurring notification with correct type
  const scheduleRecurringNotification = async (
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
          type: 'calendar',
          hour,
          minute,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling recurring notification:', error);
      return null;
    }
  };

  // Show in-app notification using Alert
  const showInAppNotification = (title: string, message: string) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  // Create fallback notification based on environment
  const createFallbackNotification = async (
    title: string,
    body: string,
    data: Record<string, any> = {}
  ) => {
    if (Platform.OS === 'android' && isExpoGoEnvironment) {
      showInAppNotification(title, body);
      return 'in-app-fallback';
    } else {
      return sendImmediateNotification(title, body, data);
    }
  };

  // Dismiss all notifications
  const dismissAllNotifications = async () => {
    await Notifications.dismissAllNotificationsAsync();
  };

  // Add notification listeners
  const addNotificationReceivedListener = Notifications.addNotificationReceivedListener;
  const addNotificationResponseReceivedListener = Notifications.addNotificationResponseReceivedListener;

  // Handler functions that use the utility functions
  const handleImmediateNotification = async () => {
    const notificationId = await sendImmediateNotification(
      'Immediate Notification',
      'This notification appears right away!'
    );

    if (notificationId) {
      setLastNotification(`Sent notification ID: ${notificationId}`);
    } else {
      setLastNotification('Failed to send notification');
    }
  };

  // Handler functions with correct trigger types
  const handleDelayedNotification = async () => {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Delayed Notification',
        body: 'This notification appears after 5 seconds!',
      },
      trigger: {
        seconds: 5,
        type: 'timeInterval'
      },
    } as any);

    if (notificationId) {
      setLastNotification(`Scheduled notification ID: ${notificationId} (in 5 seconds)`);
    } else {
      setLastNotification('Failed to schedule notification');
    }
  };

  const handleCalendarNotification = async () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 1); // 1 minute from now

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Calendar Notification',
        body: `This notification appears at ${date.toLocaleTimeString()}!`,
      },
      trigger: {
        date: date,
        type: 'date'
      } as any,
    });

    if (notificationId) {
      setLastNotification(`Scheduled notification ID: ${notificationId} for ${date.toLocaleTimeString()}`);
    } else {
      setLastNotification('Failed to schedule notification');
    }
  };

  const handleRecurringNotification = async () => {
    const now = new Date();
    const minute = (now.getMinutes() + 1) % 60; // Next minute, wrapping around 60

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Notification',
        body: `This notification appears daily at ${now.getHours()}:${minute}!`,
      },
      trigger: {
        hour: now.getHours(),
        minute: minute,
        repeats: true,
        type: 'daily'
      } as any,
    });

    if (notificationId) {
      setLastNotification(`Scheduled daily notification ID: ${notificationId} for ${now.getHours()}:${minute}`);
    } else {
      setLastNotification('Failed to schedule notification');
    }
  };

  const handleInAppNotification = async () => {
    showInAppNotification(
      'In-App Alert',
      'This is an alternative to system notifications using in-app alerts'
    );
    setLastNotification('Showed in-app notification');
  };

  const handleFallbackNotification = async () => {
    const result = await createFallbackNotification(
      'Smart Notification',
      'This notification adapts to the environment (Expo Go vs Dev Build)'
    );

    setLastNotification(`Notification result: ${result}`);
  };

  const handleClearNotifications = async () => {
    await dismissAllNotifications();
    setLastNotification('Cleared all notifications');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Test Panel</Text>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Permission status: <Text style={{ fontWeight: 'bold' }}>{permissionStatus}</Text>
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Environment: <Text style={{ fontWeight: 'bold' }}>{isExpoGoEnvironment ? 'Expo Go' : 'Development Build'}</Text>
          </Text>
          {isExpoGoEnvironment && Platform.OS === 'android' && (
            <View style={[styles.warningBox, { backgroundColor: `${theme.danger}20` }]}>
              <Text style={[styles.warningText, { color: theme.danger }]}>
                Remote notifications are limited in Expo Go on Android with SDK 53+
              </Text>
            </View>
          )}
        </View>

        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Standard Notifications</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleImmediateNotification}
        >
          <Text style={styles.buttonText}>Send Immediate Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleDelayedNotification}
        >
          <Text style={styles.buttonText}>Send Delayed Notification (5 sec)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleCalendarNotification}
        >
          <Text style={styles.buttonText}>Schedule for Specific Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleRecurringNotification}
        >
          <Text style={styles.buttonText}>Schedule Daily Notification</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Alternative Approaches</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.accent || theme.secondary }]}
          onPress={handleInAppNotification}
        >
          <Text style={styles.buttonText}>Show In-App Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.success }]}
          onPress={handleFallbackNotification}
        >
          <Text style={styles.buttonText}>Smart Notification (with Fallback)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.danger }]}
          onPress={handleClearNotifications}
        >
          <Text style={styles.buttonText}>Clear All Notifications</Text>
        </TouchableOpacity>
      </View>

      {lastNotification && (
        <View style={[styles.resultBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>Last Action:</Text>
          <Text style={[styles.resultText, { color: theme.textSecondary }]}>
            {lastNotification}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  infoContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
  },
  warningBox: {
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
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
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
  }
});

export default NotificationTester;
