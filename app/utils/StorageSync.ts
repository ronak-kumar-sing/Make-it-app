import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// Import types from their own definitions to avoid circular imports
type TimerSession = {
  id?: string;
  timestamp: string;
  duration: number;
  subject?: string;
  taskId?: string;
  isComplete: boolean;
};

// Only import basic types and not the full context to avoid circular imports
type Stats = any;
type Settings = any;

/**
 * Utility functions for synchronizing data between context and AsyncStorage
 */

/**
 * Synchronize stats data with AsyncStorage
 * @param stats Stats object from context
 */
export const syncStatsToStorage = async (stats: Stats): Promise<void> => {
  try {
    await AsyncStorage.setItem('stats', JSON.stringify(stats));
    console.log('Stats synced to AsyncStorage');
  } catch (error) {
    console.error('Error syncing stats to AsyncStorage:', error);
  }
};

/**
 * Synchronize settings data with AsyncStorage
 * @param settings Settings object from context
 */
export const syncSettingsToStorage = async (settings: Settings): Promise<void> => {
  try {
    await AsyncStorage.setItem('settings', JSON.stringify(settings));
    console.log('Settings synced to AsyncStorage');
  } catch (error) {
    console.error('Error syncing settings to AsyncStorage:', error);
  }
};

/**
 * Load timer sessions for a specific date
 * @param date Date to load sessions for (defaults to today)
 */
export const loadTimerSessionsForDate = async (date: Date = new Date()): Promise<TimerSession[]> => {
  try {
    const dateKey = format(date, 'yyyy-MM-dd');
    const sessionsKey = `sessions_${dateKey}`;
    const sessionsData = await AsyncStorage.getItem(sessionsKey);

    if (sessionsData) {
      return JSON.parse(sessionsData);
    }
    return [];
  } catch (error) {
    console.error('Error loading timer sessions:', error);
    return [];
  }
};

/**
 * Update timer session count for today
 * @param count Number of sessions completed
 */
export const updateTodaySessionCount = async (count: number): Promise<void> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sessionDataKey = `timer_sessions_${today}`;
    await AsyncStorage.setItem(
      sessionDataKey,
      JSON.stringify({
        count,
        lastUpdated: new Date().toISOString()
      })
    );
  } catch (error) {
    console.error('Error updating session count:', error);
  }
};

/**
 * Force synchronize all stats data between context and storage
 * @param stats Current stats object from context
 * @param settings Current settings object
 */
export const forceSyncAllData = async (stats: Stats, settings: Settings): Promise<void> => {
  try {
    // Create a queue of promises to run in parallel
    const syncPromises: Promise<any>[] = [];

    // Sync stats
    syncPromises.push(syncStatsToStorage(stats));

    // Sync settings
    syncPromises.push(syncSettingsToStorage(settings));

    // Sync daily session counts
    const today = format(new Date(), 'yyyy-MM-dd');
    if (stats.dailySessionCount && stats.dailySessionCount[today]) {
      syncPromises.push(updateTodaySessionCount(stats.dailySessionCount[today]));
    }

    // Run all sync operations
    await Promise.all(syncPromises);

    console.log('Manual data synchronization complete');
    return;
  } catch (error) {
    console.error('Error in manual data synchronization:', error);
    throw error;
  }
};

/**
 * Add a timer session for today
 * @param session Timer session to add
 */
export const addTimerSession = async (session: TimerSession): Promise<void> => {
  try {
    const today = format(new Date(session.timestamp), 'yyyy-MM-dd');
    const sessionsKey = `sessions_${today}`;

    // Get existing sessions
    const existingSessionsData = await AsyncStorage.getItem(sessionsKey);
    const existingSessions = existingSessionsData ? JSON.parse(existingSessionsData) : [];

    // Add new session
    existingSessions.push(session);

    // Save back to storage
    await AsyncStorage.setItem(sessionsKey, JSON.stringify(existingSessions));

    // Also update session count
    await updateSessionCount(today);
  } catch (error) {
    console.error('Error adding timer session:', error);
  }
};

/**
 * Update session count for a specific date
 * @param date Date string in yyyy-MM-dd format
 */
const updateSessionCount = async (date: string): Promise<void> => {
  try {
    const sessionsKey = `sessions_${date}`;
    const sessionsData = await AsyncStorage.getItem(sessionsKey);
    const sessions = sessionsData ? JSON.parse(sessionsData) : [];

    const sessionDataKey = `timer_sessions_${date}`;
    await AsyncStorage.setItem(
      sessionDataKey,
      JSON.stringify({
        count: sessions.length,
        lastUpdated: new Date().toISOString()
      })
    );
  } catch (error) {
    console.error('Error updating session count:', error);
  }
};
