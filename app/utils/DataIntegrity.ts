import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

/**
 * This file contains utility functions to fix data issues
 * and ensure data consistency across the app
 */

/**
 * Verify and repair data integrity issues in AsyncStorage
 * This will check for inconsistencies in stats, settings, and session data
 */
export async function verifyDataIntegrity() {
  try {
    console.log('Verifying data integrity...');

    // 1. Check for stats data
    const statsData = await AsyncStorage.getItem('stats');
    let stats = statsData ? JSON.parse(statsData) : null;
    let didFix = false;

    // If stats exist but have missing fields, fix them
    if (stats) {
      if (!stats.recentSessions) {
        stats.recentSessions = [];
        didFix = true;
      }

      if (!stats.dailySessionCount) {
        stats.dailySessionCount = {};
        didFix = true;
      }

      if (!stats.goalProgress) {
        stats.goalProgress = {
          dailyStudyTime: 0,
          weeklyStudyTime: 0,
          weeklyTasksCompleted: 0
        };
        didFix = true;
      }

      // Save fixed stats back to storage
      if (didFix) {
        await AsyncStorage.setItem('stats', JSON.stringify(stats));
        console.log('Fixed missing fields in stats data');
      }
    }

    // 2. Check for settings data
    const settingsData = await AsyncStorage.getItem('settings');
    let settings = settingsData ? JSON.parse(settingsData) : null;
    didFix = false;

    if (settings) {
      if (!settings.goalProgress) {
        settings.goalProgress = {
          dailyStudyTime: 0,
          weeklyStudyTime: 0,
          weeklyTasksCompleted: 0
        };
        didFix = true;
      }

      // Save fixed settings back to storage
      if (didFix) {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
        console.log('Fixed missing fields in settings data');
      }
    }

    // 3. Check consistency between today's session records
    const today = format(new Date(), 'yyyy-MM-dd');
    const timerSessionsKey = `timer_sessions_${today}`;
    const sessionsKey = `sessions_${today}`;

    // Get session counts
    const timerSessionsData = await AsyncStorage.getItem(timerSessionsKey);
    const sessionsData = await AsyncStorage.getItem(sessionsKey);

    const timerSessionsCount = timerSessionsData ? JSON.parse(timerSessionsData).count || 0 : 0;
    const sessionsList = sessionsData ? JSON.parse(sessionsData) || [] : [];

    // If they don't match, fix by taking the larger value
    if (sessionsList.length > 0 && timerSessionsCount !== sessionsList.length) {
      await AsyncStorage.setItem(
        timerSessionsKey,
        JSON.stringify({
          count: sessionsList.length,
          lastUpdated: new Date().toISOString()
        })
      );
      console.log(`Fixed session count mismatch: ${timerSessionsCount} → ${sessionsList.length}`);

      // Also update stats if they exist
      if (stats && stats.dailySessionCount) {
        stats.dailySessionCount[today] = sessionsList.length;
        await AsyncStorage.setItem('stats', JSON.stringify(stats));
        console.log(`Updated stats daily session count for today to ${sessionsList.length}`);
      }
    }

    console.log('Data integrity check complete');
    return true;
  } catch (error) {
    console.error('Error verifying data integrity:', error);
    return false;
  }
}

export default {
  verifyDataIntegrity
};
