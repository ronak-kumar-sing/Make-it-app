import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { syncStatsToStorage } from '../utils/StorageSync';

/**
 * Component to ensure proper data sync between context and AsyncStorage
 */
const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats } = useContext(AppContext);

  // Ensure stats are synced when they change
  useEffect(() => {
    // Sync stats to AsyncStorage whenever they change
    syncStatsToStorage(stats).catch((error: Error) =>
      console.error('Error syncing stats to storage:', error)
    );

    // Also check if timer sessions are consistent with stats
    const validateSessionData = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        // Get daily session count from AsyncStorage
        const sessionsKey = `timer_sessions_${today}`;
        const savedSessionsData = await AsyncStorage.getItem(sessionsKey);
        const savedCount = savedSessionsData ? JSON.parse(savedSessionsData).count || 0 : 0;

        // Get count from stats
        const statsCount = (stats.dailySessionCount || {})[today] || 0;

        // If they don't match, update the AsyncStorage data to match stats
        if (savedCount !== statsCount && statsCount > 0) {
          await AsyncStorage.setItem(
            sessionsKey,
            JSON.stringify({
              count: statsCount,
              lastUpdated: new Date().toISOString()
            })
          );
          console.log(`Session count synced: AsyncStorage: ${savedCount} → Stats: ${statsCount}`);
        }
      } catch (error) {
        console.error('Error validating session data:', error);
      }
    };

    validateSessionData();
  }, [stats]);

  return <>{children}</>;
};

export default DataSyncProvider;
