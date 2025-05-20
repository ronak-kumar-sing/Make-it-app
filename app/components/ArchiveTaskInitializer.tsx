import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { AppContext } from '../context/AppContext';
import * as ArchiveService from '../services/ArchiveService';
import { registerAutoArchiveTask, unregisterAutoArchiveTask } from '../services/BackgroundTaskManager';
import * as PermissionsManager from '../services/PermissionsManager';

/**
 * Component that handles automatic archiving setup for tasks
 * This component doesn't render anything - it just manages the background archiving task
 */
export default function ArchiveTaskInitializer() {
  const { settings, archiveOldTasks } = useContext(AppContext);
  const appStateRef = useRef(AppState.currentState);
  const lastSettingsState = useRef({
    autoArchive: settings.autoArchive,
    archiveDays: settings.archiveDays
  });

  // State to track last archive run time
  const [lastArchiveRun, setLastArchiveRun] = useState<Date | null>(null);

  // Set up or tear down the background archive task based on settings
  useEffect(() => {
    const setupArchiveTask = async () => {
      // If automatic archiving is enabled, register the background task
      if (settings.autoArchive) {
        console.log('Setting up automatic archiving with threshold:', settings.archiveDays, 'days');

        // Check if we have notification permissions for background tasks
        const permissionStatus = await PermissionsManager.checkNotificationPermission();

        if (!permissionStatus.notifications) {
          console.log('Notification permission required for automatic archiving');
          // Request permission with explanation dialog
          const granted = await PermissionsManager.requestNotificationPermissionsWithDialog();

          if (!granted) {
            console.log('Notification permission denied - automatic archiving will only work when app is open');
            // Show the user a notification that background archiving will be limited
            Alert.alert(
              'Limited Archiving Functionality',
              'Without notification permissions, automatic archiving will only work when the app is open.',
              [{ text: 'OK' }]
            );
          }
        }

        // Register the background task (will work with limited functionality if permissions not granted)
        await registerAutoArchiveTask();

        // Run once immediately after setup or settings change using the ArchiveService
        const result = await ArchiveService.runArchiveTaskManually();
        if (result.archived > 0 || result.deleted > 0) {
          console.log(`Auto-archived ${result.archived} tasks, deleted ${result.deleted} old tasks`);
          setLastArchiveRun(new Date());
        }
      } else {
        // If automatic archiving is disabled, unregister the task
        await unregisterAutoArchiveTask();
      }
    };

    // Only setup/tear down if the relevant settings changed
    if (settings.autoArchive !== lastSettingsState.current.autoArchive ||
      settings.archiveDays !== lastSettingsState.current.archiveDays) {

      setupArchiveTask().catch(error => {
        console.error('Error setting up archive task:', error);
      });

      // Update our reference to current settings
      lastSettingsState.current = {
        autoArchive: settings.autoArchive,
        archiveDays: settings.archiveDays
      };
    }

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      // When app comes to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, checking for tasks to archive');

        // Run manual archive if auto-archive is enabled
        if (settings.autoArchive) {
          // Only run if we haven't run in the last hour
          const now = new Date();
          if (!lastArchiveRun || (now.getTime() - lastArchiveRun.getTime() > 60 * 60 * 1000)) {
            ArchiveService.runArchiveTaskManually()
              .then(result => {
                if (result.archived > 0 || result.deleted > 0) {
                  console.log(`Auto-archived ${result.archived} tasks, deleted ${result.deleted} old tasks`);
                  setLastArchiveRun(now);
                }
              })
              .catch(error => {
                console.error('Error running archive task:', error);
              });
          }
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [settings.autoArchive, settings.archiveDays, archiveOldTasks]);

  // Component doesn't render anything
  return null;
}
