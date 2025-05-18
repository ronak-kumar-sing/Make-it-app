import { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import * as NotificationService from '../services/NotificationService';

/**
 * Component that handles notification initialization and permission requests
 * This component doesn't render anything - it just handles the notification setup
 */
export default function NotificationInitializer() {
  const { settings, tasks, exams, streaks, stats } = useContext(AppContext);

  // Initialize notifications when settings or related data change
  useEffect(() => {
    const initializeNotificationSystem = async () => {
      // Check if notifications are enabled in app settings
      if (settings.notifications) {
        // Check if device can use notifications
        const notificationsAvailable = await NotificationService.areNotificationsAvailable();
        if (!notificationsAvailable) {
          console.log('Notifications not available on this device (simulator/emulator)');
          return;
        }

        await NotificationService.initializeNotifications(
          true,
          tasks,
          exams,
          streaks,
          stats.goalProgress.dailyStudyTime || 0,
          settings.dailyGoalMinutes
        );
      }
    };

    // Initialize notifications
    initializeNotificationSystem();

    // When the component unmounts, we don't need to clean up
    // notification registration as they persist at the OS level
  }, [settings.notifications, tasks, exams, streaks.current, stats.goalProgress.dailyStudyTime, settings.dailyGoalMinutes]);

  // This component doesn't render anything
  return null;
}
