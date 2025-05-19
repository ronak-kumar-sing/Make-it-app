import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationPermissionDialog from '../components/NotificationPermissionDialog';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import * as NotificationService from '../services/NotificationService';
import { verifyDataIntegrity } from '../utils/DataIntegrity';
import { forceSyncAllData } from '../utils/StorageSync';

const SettingsScreen = ({ navigation }) => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    archiveOldTasks,
    lastBackup,
    stats
  } = useContext(AppContext);

  const { theme, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();

  // Add state for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to force sync all data
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);

      // First verify data integrity
      await verifyDataIntegrity();

      // Then force sync all data
      await forceSyncAllData(stats, settings);

      // Show success message
      Alert.alert(
        'Sync Complete',
        'All app data has been synchronized successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert(
        'Sync Error',
        'There was a problem syncing your data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Local state for settings with auto-save
  const [pomodoroLength, setPomodoroLength] = useState(settings.pomodoroLength);
  const [shortBreakLength, setShortBreakLength] = useState(settings.shortBreakLength);
  const [longBreakLength, setLongBreakLength] = useState(settings.longBreakLength);
  const [longBreakInterval, setLongBreakInterval] = useState(settings.longBreakInterval);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(settings.dailyGoalMinutes);
  const [weeklyTaskGoal, setWeeklyTaskGoal] = useState(settings.weeklyTaskGoal || 10);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [healthNotifications, setHealthNotifications] = useState(settings.healthNotifications !== false); // Default to true
  const [focusMode, setFocusMode] = useState(settings.focusMode);
  const [autoArchive, setAutoArchive] = useState(settings.autoArchive);
  const [archiveDays, setArchiveDays] = useState(settings.archiveDays);
  const [taskRetentionWeeks, setTaskRetentionWeeks] = useState(settings.taskRetentionWeeks || 7);
  const [privacyLock, setPrivacyLock] = useState(settings.privacyLock);

  // Define wrapper functions that only update state without auto-saving
  const handlePomodoroChange = (value: number) => {
    setPomodoroLength(value);
  };

  const handleShortBreakChange = (value: number) => {
    setShortBreakLength(value);
  };

  const handleLongBreakChange = (value: number) => {
    setLongBreakLength(value);
  };

  const handleLongBreakIntervalChange = (value: number) => {
    setLongBreakInterval(value);
  };

  const handleDailyGoalChange = (value: number) => {
    setDailyGoalMinutes(value);
  };

  const handleWeeklyTaskGoalChange = (value: number) => {
    setWeeklyTaskGoal(value);
  };

  // State for notification dialogs
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleNotificationsChange = (value: boolean) => {
    if (value) {
      // If turning ON notifications, show the permission dialog
      setShowNotificationDialog(true);
    } else {
      // If turning OFF notifications, just update the state
      setNotifications(false);
      // Cancel all scheduled notifications
      NotificationService.cancelAllNotifications();
    }
  };

  // Handle the result of the notification permission dialog
  const handleNotificationPermissionResult = (granted: boolean) => {
    setShowNotificationDialog(false);
    setNotifications(granted);

    if (granted) {
      // Initialize notifications with current data
      NotificationService.initializeNotifications(
        true,
        tasks,
        exams,
        streaks,
        stats.goalProgress.dailyStudyTime || 0,
        settings.dailyGoalMinutes
      );

      // Also initialize health notifications if they're enabled
      if (healthNotifications) {
        NotificationService.initializeHealthNotifications(true);
      }
    }
  };

  // Handle health notifications toggle
  const handleHealthNotificationsChange = (value: boolean) => {
    setHealthNotifications(value);

    if (value && notifications) {
      // If turning ON health notifications, initialize them
      NotificationService.initializeHealthNotifications(true);
    } else if (!value) {
      // If turning OFF health notifications, cancel them
      NotificationService.cancelHealthNotifications?.();
    }

    // Update the settings
    updateSettings({ ...settings, healthNotifications: value });
  };

  const handleFocusModeChange = (value: boolean) => {
    setFocusMode(value);
  };

  const handleAutoArchiveChange = (value: boolean) => {
    setAutoArchive(value);
  };

  const handleArchiveDaysChange = (value: number) => {
    setArchiveDays(value);
  };

  const handleTaskRetentionChange = (value: number) => {
    setTaskRetentionWeeks(value);
  };

  const handlePrivacyLockChange = (value: boolean) => {
    setPrivacyLock(value);
  };

  // Task filter settings
  const [enabledFilters, setEnabledFilters] = useState(settings.enabledFilters || {
    today: true,
    upcoming: true,
    overdue: true,
    ongoing: true,
    thisWeek: true,
    priority: true,
    completed: true,
    archived: false
  });
  const [prioritizeOverdue, setPrioritizeOverdue] = useState(settings.prioritizeOverdue !== false);

  // Filters without auto-save
  const handleFiltersChange = (newFilters: typeof enabledFilters) => {
    setEnabledFilters(newFilters);
  };

  const handlePrioritizeOverdueChange = (value: boolean) => {
    setPrioritizeOverdue(value);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Handle data export
  const handleExport = async () => {
    const success = await exportData();
    if (success) {
      Alert.alert('Success', 'Study data exported successfully.');
    }
  };

  // Handle data import
  const handleImport = async () => {
    Alert.alert(
      'Import Data',
      'Importing data will replace your current data. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Import',
          onPress: async () => {
            const success = await importData();
            if (success) {
              Alert.alert('Success', 'Data imported successfully.');
            }
          },
        },
      ]
    );
  };

  // Handle archive old tasks
  const handleArchiveOldTasks = () => {
    if (!autoArchive) {
      Alert.alert(
        'Archive Old Tasks',
        `This will archive completed tasks older than ${archiveDays} days. Continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Archive',
            onPress: () => {
              const count = archiveOldTasks(archiveDays);
              Alert.alert('Tasks Archived', `${count} tasks have been archived.`);
            },
          },
        ]
      );
    }
  };

  // Reset all app data
  const resetAppData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all app data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Data Reset',
                'All app data has been reset. Please restart the app.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // In a real app, you would restart the app here
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app data.');
            }
          },
        },
      ]
    );
  };

  // Save settings to context manually
  const saveSettings = () => {
    updateSettings({
      pomodoroLength,
      shortBreakLength,
      longBreakLength,
      longBreakInterval,
      dailyGoalMinutes,
      weeklyTaskGoal,
      notifications,
      healthNotifications,
      theme: isDark ? 'dark' : 'light',
      focusMode,
      autoArchive,
      archiveDays,
      taskRetentionWeeks,
      privacyLock,
      enabledFilters,
      prioritizeOverdue
    });

    // Show confirmation to the user
    Alert.alert(
      'Settings Saved',
      'Your settings have been saved successfully.',
      [{ text: 'OK' }]
    );
  };

  // Get theme mode text
  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Notification Permission Dialog */}
      <NotificationPermissionDialog
        visible={showNotificationDialog}
        onClose={handleNotificationPermissionResult}
        theme={theme}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        theme={theme}
      />

      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

        {/* Theme Settings Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Theme Mode</Text>
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: theme.primaryLight }]}
              onPress={() => {
                toggleTheme();
              }}
            >
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={18}
                color={theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.themeButtonText, { color: theme.primary }]}>
                {getThemeModeText()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'light' && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
              ]}
              onPress={() => {
                setThemeMode('light');
              }}
            >
              <Ionicons name="sunny" size={24} color={themeMode === 'light' ? theme.primary : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'light' ? theme.primary : theme.textSecondary }
              ]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'dark' && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
              ]}
              onPress={() => {
                setThemeMode('dark');
              }}
            >
              <Ionicons name="moon" size={24} color={themeMode === 'dark' ? theme.primary : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'dark' ? theme.primary : theme.textSecondary }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'system' && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
              ]}
              onPress={() => {
                setThemeMode('system');
              }}
            >
              <Ionicons name="phone-portrait" size={24} color={themeMode === 'system' ? theme.primary : theme.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'system' ? theme.primary : theme.textSecondary }
              ]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Timer Settings</Text>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Focus Duration</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{pomodoroLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={5}
            value={pomodoroLength}
            onValueChange={handlePomodoroChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Short Break Duration</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{shortBreakLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={15}
            step={1}
            value={shortBreakLength}
            onValueChange={handleShortBreakChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Long Break Duration</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{longBreakLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={30}
            step={5}
            value={longBreakLength}
            onValueChange={handleLongBreakChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Long Break After</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{longBreakInterval} sessions</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={6}
            step={1}
            value={longBreakInterval}
            onValueChange={handleLongBreakIntervalChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Goal Settings</Text>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Study Goal</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{(dailyGoalMinutes / 60).toFixed(1)} hrs</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={30}
            maximumValue={480}
            step={30}
            value={dailyGoalMinutes}
            onValueChange={handleDailyGoalChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Weekly Tasks Goal</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{weeklyTaskGoal} tasks</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={50}
            step={5}
            value={weeklyTaskGoal}
            onValueChange={handleWeeklyTaskGoalChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Task Filters</Text>

          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Customize the filters shown on your Tasks screen
          </Text>

          <View style={styles.taskFilterGrid}>
            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.today ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, today: !enabledFilters.today })}
            >
              <Ionicons
                name="today"
                size={20}
                color={enabledFilters.today ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.today ? "#FFFFFF" : theme.textSecondary }
              ]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.upcoming ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, upcoming: !enabledFilters.upcoming })}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={enabledFilters.upcoming ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.upcoming ? "#FFFFFF" : theme.textSecondary }
              ]}>
                Upcoming
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskFilterGrid}>
            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.overdue ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, overdue: !enabledFilters.overdue })}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={enabledFilters.overdue ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.overdue ? "#FFFFFF" : theme.textSecondary }
              ]}>
                Overdue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.ongoing ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, ongoing: !enabledFilters.ongoing })}
            >
              <Ionicons
                name="hourglass"
                size={20}
                color={enabledFilters.ongoing ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.ongoing ? "#FFFFFF" : theme.textSecondary }
              ]}>
                In Progress
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskFilterGrid}>
            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.thisWeek ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, thisWeek: !enabledFilters.thisWeek })}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={enabledFilters.thisWeek ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.thisWeek ? "#FFFFFF" : theme.textSecondary }
              ]}>
                This Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.priority ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, priority: !enabledFilters.priority })}
            >
              <Ionicons
                name="flag"
                size={20}
                color={enabledFilters.priority ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.priority ? "#FFFFFF" : theme.textSecondary }
              ]}>
                High Priority
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskFilterGrid}>
            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.completed ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, completed: !enabledFilters.completed })}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={enabledFilters.completed ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.completed ? "#FFFFFF" : theme.textSecondary }
              ]}>
                Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taskFilter,
                { backgroundColor: enabledFilters.archived ? theme.primary : theme.border + '30' },
              ]}
              onPress={() => handleFiltersChange({ ...enabledFilters, archived: !enabledFilters.archived })}
            >
              <Ionicons
                name="archive"
                size={20}
                color={enabledFilters.archived ? "#FFFFFF" : theme.textSecondary}
              />
              <Text style={[
                styles.taskFilterText,
                { color: enabledFilters.archived ? "#FFFFFF" : theme.textSecondary }
              ]}>
                Archived
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Prioritize Overdue Tasks</Text>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
              onValueChange={handlePrioritizeOverdueChange}
              value={prioritizeOverdue}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>

          <View style={styles.toggleItem}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Notifications</Text>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
              onValueChange={handleNotificationsChange}
              value={notifications}
            />
          </View>

          {notifications && (
            <>
              <View style={styles.toggleItem}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Health Notifications</Text>
                <Switch
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={theme.border}
                  onValueChange={handleHealthNotificationsChange}
                  value={healthNotifications}
                  disabled={!notifications}
                />
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primaryLight, marginTop: 4 }]}
                onPress={() => setShowNotificationSettings(true)}
              >
                <Ionicons name="options-outline" size={20} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Notification Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primaryLight, marginTop: 8 }]}
                onPress={() => {
                  // Test notification
                  NotificationService.sendTimerCompletionNotification('test', 'Testing notifications');
                  Alert.alert('Test Sent', 'A test notification has been sent. Check your notifications.');
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.primary }]}>Test Notifications</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.toggleItem}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Focus Mode</Text>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
              onValueChange={handleFocusModeChange}
              value={focusMode}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Privacy Lock</Text>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
              onValueChange={handlePrivacyLockChange}
              value={privacyLock}
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight, marginTop: 8 }]}
            onPress={() => navigation.navigate('PermissionsTest')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Manage App Permissions</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>

          <View style={styles.toggleItem}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Auto-Archive Old Tasks</Text>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
              onValueChange={handleAutoArchiveChange}
              value={autoArchive}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Archive After (Days)</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{archiveDays} days</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={7}
            maximumValue={90}
            step={7}
            value={archiveDays}
            onValueChange={handleArchiveDaysChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
            disabled={!autoArchive}
          />

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Task Retention Period</Text>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{taskRetentionWeeks} weeks</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={52}
            step={1}
            value={taskRetentionWeeks}
            onValueChange={handleTaskRetentionChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleArchiveOldTasks}
            disabled={autoArchive}
          >
            <Ionicons name="archive-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Archive Old Tasks Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleExport}
          >
            <Ionicons name="download-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Export Data Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleImport}
          >
            <Ionicons name="cloud-download-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Import Data Backup</Text>
          </TouchableOpacity>

          {lastBackup && (
            <Text style={[styles.lastBackupText, { color: theme.textSecondary }]}>
              Last backup: {formatDate(lastBackup)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
            onPress={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="sync-outline" size={20} color={theme.primary} />
            )}
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              {isSyncing ? 'Syncing...' : 'Repair Data & Sync'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.danger }]}
            onPress={resetAppData}
          >
            <Text style={[styles.resetButtonText, { color: theme.danger }]}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Developer Details</Text>

          <View style={styles.aboutContainer}>
            <Text style={[styles.appName, { color: theme.primary }]}>StudyStreak</Text>
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.0.0</Text>

            <Text style={[styles.developerName, { color: theme.text }]}>Ronak Kumar Singh</Text>
            <Text style={[styles.developerInfo, { color: theme.textSecondary }]}>Lovely Professional University</Text>

            <TouchableOpacity
              style={[styles.aboutItem, { borderBottomColor: theme.border }]}
              onPress={() => Linking.openURL('https://www.linkedin.com/in/ronak-kumar-a2b721285/')}
            >
              <Ionicons name="logo-linkedin" size={24} color={theme.primary} />
              <Text style={[styles.aboutItemText, { color: theme.text }]}>LinkedIn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aboutItem, { borderBottomColor: theme.border }]}
              onPress={() => Linking.openURL('https://www.instagram.com/_ronak.kumar/')}
            >
              <Ionicons name="logo-instagram" size={24} color={theme.primary} />
              <Text style={[styles.aboutItemText, { color: theme.text }]}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aboutItem, { borderBottomColor: theme.border }]}
              onPress={() => Linking.openURL('https://github.com/ronak-kumar-sing/')}
            >
              <Ionicons name="logo-github" size={24} color={theme.primary} />
              <Text style={[styles.aboutItemText, { color: theme.text }]}>GitHub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aboutItem, { borderBottomColor: theme.border }]}
              onPress={() => Linking.openURL('https://make-it-showcase.vercel.app/')}
            >
              <Ionicons name="globe-outline" size={24} color={theme.primary} />
              <Text style={[styles.aboutItemText, { color: theme.text }]}>Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  slider: {
    height: 40,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  themeButtonText: {
    fontWeight: '500',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  taskFilterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  taskFilterText: {
    marginLeft: 8,
    fontSize: 14,
  },
  lastBackupText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  aboutContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    width: '100%',
  },
  aboutItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  saveButton: {
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  developerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  developerInfo: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default SettingsScreen;