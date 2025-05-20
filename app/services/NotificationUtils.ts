// Add the missing notification methods to NotificationService.ts

import * as Notifications from 'expo-notifications';

// Daily goal reminder
export const scheduleDailyGoalReminder = async (
  currentStudyTime: number,
  goalMinutes: number
) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return;

    // Cancel any existing daily goal reminders
    await cancelNotificationsByType(NOTIFICATION_TYPES.DAILY_GOAL_REMINDER);

    // Calculate remaining minutes
    const remainingMinutes = goalMinutes - currentStudyTime;
    if (remainingMinutes <= 0) return; // Goal already met

    // Schedule for 8pm if it's earlier, or 1 hour from now if it's later
    const now = new Date();
    const reminderTime = new Date();
    const targetHour = 20; // 8 PM

    if (now.getHours() < targetHour) {
      reminderTime.setHours(targetHour, 0, 0, 0); // 8 PM
    } else {
      reminderTime.setHours(now.getHours() + 1, 0, 0, 0); // 1 hour from now
    }

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Study Goal Reminder',
        body: `You're ${remainingMinutes} minutes away from your daily study goal. Keep going!`,
        data: {
          type: NOTIFICATION_TYPES.DAILY_GOAL_REMINDER
        },
        priority: 'high',
        sound: true
      },
      trigger: {
        date: reminderTime
      }
    });

    console.log(`Daily goal reminder scheduled for ${reminderTime.toLocaleString()}`);
  } catch (err) {
    console.error('Error scheduling daily goal reminder:', err);
  }
};

// Streak reminder
export const scheduleStreakReminder = async (currentStreak: number) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return;

    // Cancel any existing streak reminders
    await cancelNotificationsByType(NOTIFICATION_TYPES.STREAK_REMINDER);

    // Only remind if streak is at least 2 days
    if (currentStreak < 2) return;

    // Schedule for 9am tomorrow
    const reminderTime = new Date();
    reminderTime.setDate(reminderTime.getDate() + 1);
    reminderTime.setHours(9, 0, 0, 0);

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep Your Study Streak Going!',
        body: `You have a ${currentStreak}-day study streak. Don't break it!`,
        data: {
          type: NOTIFICATION_TYPES.STREAK_REMINDER
        },
        priority: 'high',
        sound: true
      },
      trigger: {
        date: reminderTime
      }
    });

    console.log(`Streak reminder scheduled for ${reminderTime.toLocaleString()}`);
  } catch (err) {
    console.error('Error scheduling streak reminder:', err);
  }
};

// Achievement notification
export const sendAchievementNotification = async (achievementName: string) => {
  try {
    const { status } = await checkPermissions();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Achievement Unlocked! 🏆',
        body: `You've unlocked the "${achievementName}" achievement!`,
        data: {
          type: NOTIFICATION_TYPES.ACHIEVEMENT
        },
        priority: 'high',
        sound: true
      },
      trigger: null // Send immediately
    });
  } catch (err) {
    console.error('Error sending achievement notification:', err);
  }
};

// Helper function to cancel notifications by type
export const cancelNotificationsByType = async (notificationType: string) => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === notificationType) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (err) {
    console.error('Error canceling notifications by type:', err);
  }
};
