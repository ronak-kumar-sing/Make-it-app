// Notification type constants - shared across notification services
// This file breaks the require cycle between NotificationService and BackgroundNotificationHandler

export const NOTIFICATION_TYPES = {
  TASK_DUE: 'TASK_DUE',
  TASK_REMINDER: 'TASK_REMINDER',
  EXAM_REMINDER: 'EXAM_REMINDER',
  TIMER_COMPLETED: 'TIMER_COMPLETED',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
