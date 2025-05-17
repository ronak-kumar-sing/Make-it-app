import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { useContext, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    archiveOldTasks,
    lastBackup
  } = useContext(AppContext);

  const { theme, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();

  // Local state for settings
  const [pomodoroLength, setPomodoroLength] = useState(settings.pomodoroLength);
  const [shortBreakLength, setShortBreakLength] = useState(settings.shortBreakLength);
  const [longBreakLength, setLongBreakLength] = useState(settings.longBreakLength);
  const [longBreakInterval, setLongBreakInterval] = useState(settings.longBreakInterval);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(settings.dailyGoalMinutes);
  const [weeklyTaskGoal, setWeeklyTaskGoal] = useState(settings.weeklyTaskGoal || 10);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [focusMode, setFocusMode] = useState(settings.focusMode);
  const [autoArchive, setAutoArchive] = useState(settings.autoArchive);
  const [archiveDays, setArchiveDays] = useState(settings.archiveDays);
  const [taskRetentionWeeks, setTaskRetentionWeeks] = useState(settings.taskRetentionWeeks || 7);
  const [privacyLock, setPrivacyLock] = useState(settings.privacyLock);

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
  const [prioritizeOverdue, setPrioritizeOverdue] = useState(settings.prioritizeOverdue || true);

  // Format date for display
  const formatDate = (dateString) => {
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

  // Save settings to context
  const saveSettings = () => {
    updateSettings({
      pomodoroLength,
      shortBreakLength,
      longBreakLength,
      longBreakInterval,
      dailyGoalMinutes,
      weeklyTaskGoal,
      notifications,
      focusMode,
      autoArchive,
      archiveDays,
      taskRetentionWeeks,
      privacyLock,
      enabledFilters,
      prioritizeOverdue
    });

    Alert.alert('Settings Saved', 'Your settings have been saved.');
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
              onPress={toggleTheme}
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
              onPress={() => setThemeMode('light')}
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
              onPress={() => setThemeMode('dark')}
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
              onPress={() => setThemeMode('system')}
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
            onValueChange={setPomodoroLength}
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
            onValueChange={setShortBreakLength}
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
            onValueChange={setLongBreakLength}
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
            onValueChange={setLongBreakInterval}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
          />
        </View>

        {/* Rest of the settings sections remain the same, just update color references to use theme */}
        {/* ... */}

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
  // Rest of the styles remain the same
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
  activeTaskFilter: {
    backgroundColor: '#6C63FF',
  },
  taskFilterText: {
    marginLeft: 8,
    fontSize: 14,
  },
  lastBackupText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
});

export default SettingsScreen;