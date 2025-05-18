import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import NotificationTester from '../components/NotificationTester';
import { useTheme } from '../context/ThemeContext';
import { setupStandardNotifications } from '../services/NotificationAlternatives';
import * as NotificationService from '../services/NotificationService';

export default function NotificationDemoScreen() {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Set up notifications when the screen loads
  useEffect(() => {
    const prepareNotifications = async () => {
      // Set up standard notification handler
      setupStandardNotifications();

      // Request permissions if needed
      await NotificationService.requestNotificationPermissions();

      setIsReady(true);
    };

    prepareNotifications();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notification Demo</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Testing notification alternatives for Expo Go
          </Text>
        </View>

        {isReady ? (
          <NotificationTester theme={theme} />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Setting up notifications...
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoHeader, { color: theme.text }]}>About Notifications</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            This screen demonstrates various approaches to implement notifications in your app,
            including workarounds for Expo Go limitations with SDK 53+.
          </Text>

          <Text style={[styles.infoHeader, { color: theme.text, marginTop: 16 }]}>Technical Notes</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • Local notifications work in both Expo Go and development builds{'\n'}
            • Remote notifications (push) don't work in Expo Go on Android{'\n'}
            • The alternative approaches show how to adapt based on your environment{'\n'}
            • In-app alerts provide a fallback for environments with limitations
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  infoSection: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  infoHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  }
});
