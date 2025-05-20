import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import * as NotificationService from '../services/NotificationService';

/**
 * Component that handles notification initialization and permission requests
 * This component doesn't render anything - it just handles the notification setup
 */
export default function NotificationInitializer() {
  const { settings, tasks, exams } = useContext(AppContext);
  const initializationCompleted = useRef(false);
  const lastDataHash = useRef('');

  // Initialize notifications when settings or related data change
  useEffect(() => {
    const initializeNotificationSystem = async () => {
      // Check if notifications are enabled in app settings
      if (!settings.notifications) return;

      // Check if device can use notifications
      const notificationsAvailable = await NotificationService.areNotificationsAvailable();
      if (!notificationsAvailable) {
        console.log('Notifications not available on this device (simulator/emulator)');
        return;
      }

      // Hash the data to determine if we actually need to re-initialize
      const newDataHash = JSON.stringify({
        tasksLength: tasks.length,
        examsLength: exams.length,
        tasksUpdated: tasks.map(t => `${t.id}-${t.completed}`).join(''),
        examsUpdated: exams.map(e => `${e.id}-${e.completed}`).join(''),
        reminderMinutes: settings.taskReminderMinutes // Include reminder minutes in the hash
      });

      // Skip initialization if nothing has changed and we've already initialized once
      if (initializationCompleted.current && lastDataHash.current === newDataHash) {
        return;
      }

      // Store the last data state
      lastDataHash.current = newDataHash;

      // Create or update permissions status storage
      const lastPermissionRequest = await AsyncStorage.getItem('lastPermissionRequest');
      const now = new Date().getTime();

      // Only ask for permissions once per day maximum
      if (!lastPermissionRequest || (now - parseInt(lastPermissionRequest)) > 86400000) {
        console.log('Checking notification permissions during app initialization');

        // Check if we already have permissions before showing the dialog
        const permissionGranted = await NotificationService.requestNotificationPermissions();
        console.log('Notification permission request result:', permissionGranted);

        if (permissionGranted) {
          console.log('Notification permissions granted');
          await AsyncStorage.setItem('lastPermissionRequest', now.toString());
        } else {
          console.log('Notification permissions not granted');
          return;
        }
      } else {
        console.log('Skipping permission request - asked recently');
      }

      // Initialize study-related notifications with only essential notifications
      await NotificationService.initializeNotifications(
        true,
        tasks,
        exams,
        settings.taskReminderMinutes // Pass the reminder minutes setting
      );

      initializationCompleted.current = true;
    };

    // Initialize notifications
    initializeNotificationSystem();

    // When the component unmounts, we don't need to clean up
    // notification registration as they persist at the OS level
  }, [
    settings.notifications,
    tasks,
    exams
  ]);

  // This component doesn't render anything
  return null;
}
