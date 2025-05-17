import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context';

const SettingsScreen = () => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    archiveOldTasks,
    lastBackup
  } = useContext(AppContext);

  // Local state for settings
  const [pomodoroLength, setPomodoroLength] = useState(settings.pomodoroLength);
  const [shortBreakLength, setShortBreakLength] = useState(settings.shortBreakLength);
  const [longBreakLength, setLongBreakLength] = useState(settings.longBreakLength);
  const [longBreakInterval, setLongBreakInterval] = useState(settings.longBreakInterval);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(settings.dailyGoalMinutes);
  const [weeklyTaskGoal, setWeeklyTaskGoal] = useState(settings.weeklyTaskGoal || 10);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [theme, setTheme] = useState(settings.theme);
  const [focusMode, setFocusMode] = useState(settings.focusMode);
  const [autoArchive, setAutoArchive] = useState(settings.autoArchive);
  const [archiveDays, setArchiveDays] = useState(settings.archiveDays);
  const [taskRetentionWeeks, setTaskRetentionWeeks] = useState(settings.taskRetentionWeeks || 7);
  const [privacyLock, setPrivacyLock] = useState(settings.privacyLock);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Save settings
  const saveSettings = () => {
    updateSettings({
      pomodoroLength,
      shortBreakLength,
      longBreakLength,
      longBreakInterval,
      dailyGoalMinutes,
      weeklyTaskGoal,
      notifications,
      theme,
      focusMode,
      autoArchive,
      archiveDays,
      taskRetentionWeeks,
      privacyLock
    });

    Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
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

  // Handle manual backup
  const handleBackup = async () => {
    const success = await exportData();
    if (success) {
      Alert.alert('Backup Created', 'Your data has been successfully backed up.');
    }
  };

  // Handle data import
  const handleImport = async () => {
    await importData();
  };

  // Handle manual archive
  const handleManualArchive = () => {
    Alert.alert(
      'Archive Old Tasks',
      'This will archive completed tasks older than the specified number of days. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Archive',
          onPress: () => {
            archiveOldTasks();
            Alert.alert('Tasks Archived', 'Your old completed tasks have been archived.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Settings</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Focus Duration</Text>
            <Text style={styles.settingValue}>{pomodoroLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={5}
            value={pomodoroLength}
            onValueChange={setPomodoroLength}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Short Break Duration</Text>
            <Text style={styles.settingValue}>{shortBreakLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={15}
            step={1}
            value={shortBreakLength}
            onValueChange={setShortBreakLength}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Long Break Duration</Text>
            <Text style={styles.settingValue}>{longBreakLength} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={30}
            step={5}
            value={longBreakLength}
            onValueChange={setLongBreakLength}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Long Break Interval</Text>
            <Text style={styles.settingValue}>{longBreakInterval} sessions</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={6}
            step={1}
            value={longBreakInterval}
            onValueChange={setLongBreakInterval}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Daily Study Goal</Text>
            <Text style={styles.settingValue}>{dailyGoalMinutes} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={30}
            maximumValue={240}
            step={30}
            value={dailyGoalMinutes}
            onValueChange={setDailyGoalMinutes}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Weekly Task Goal</Text>
            <Text style={styles.settingValue}>{weeklyTaskGoal} tasks</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={weeklyTaskGoal}
            onValueChange={setWeeklyTaskGoal}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#EEEEEE"
            thumbTintColor="#6C63FF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Notifications</Text>
            <Switch
              trackColor={{ false: '#EEEEEE', true: '#6C63FF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EEEEEE"
              onValueChange={setNotifications}
              value={notifications}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Dark Theme</Text>
            <Switch
              trackColor={{ false: '#EEEEEE', true: '#6C63FF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EEEEEE"
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              value={theme === 'dark'}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Focus Mode</Text>
            <Switch
              trackColor={{ false: '#EEEEEE', true: '#6C63FF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EEEEEE"
              onValueChange={setFocusMode}
              value={focusMode}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Privacy Lock</Text>
            <Switch
              trackColor={{ false: '#EEEEEE', true: '#6C63FF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EEEEEE"
              onValueChange={setPrivacyLock}
              value={privacyLock}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Auto-Archive Old Tasks</Text>
            <Switch
              trackColor={{ false: '#EEEEEE', true: '#6C63FF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EEEEEE"
              onValueChange={setAutoArchive}
              value={autoArchive}
            />
          </View>

          {autoArchive && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Archive After (Days)</Text>
                <Text style={styles.settingValue}>{archiveDays} days</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={7}
                maximumValue={90}
                step={1}
                value={archiveDays}
                onValueChange={setArchiveDays}
                minimumTrackTintColor="#6C63FF"
                maximumTrackTintColor="#EEEEEE"
                thumbTintColor="#6C63FF"
              />

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Task History Retention</Text>
                <Text style={styles.settingValue}>{taskRetentionWeeks} weeks</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={52}
                step={1}
                value={taskRetentionWeeks}
                onValueChange={setTaskRetentionWeeks}
                minimumTrackTintColor="#6C63FF"
                maximumTrackTintColor="#EEEEEE"
                thumbTintColor="#6C63FF"
              />
              <Text style={styles.settingDescription}>
                Tasks will be permanently deleted after the specified number of weeks
              </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleManualArchive}
          >
            <Ionicons name="archive-outline" size={24} color="#6C63FF" />
            <Text style={styles.dataButtonText}>Archive Old Tasks Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleBackup}
          >
            <Ionicons name="download-outline" size={24} color="#6C63FF" />
            <Text style={styles.dataButtonText}>Export Data Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleImport}
          >
            <Ionicons name="cloud-download-outline" size={24} color="#6C63FF" />
            <Text style={styles.dataButtonText}>Import Data Backup</Text>
          </TouchableOpacity>

          {lastBackup && (
            <Text style={styles.lastBackupText}>
              Last backup: {formatDate(lastBackup)}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <Text style={styles.privacyText}>
            StudyStreak is designed with privacy in mind. All your data is stored locally on your device and is never uploaded to any server. Your study habits, tasks, and progress remain completely private.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.aboutItem}>
            <Ionicons name="information-circle-outline" size={24} color="#6C63FF" />
            <Text style={styles.aboutItemText}>About StudyStreak</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aboutItem}>
            <Ionicons name="star-outline" size={24} color="#6C63FF" />
            <Text style={styles.aboutItemText}>Rate the App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aboutItem}>
            <Ionicons name="mail-outline" size={24} color="#6C63FF" />
            <Text style={styles.aboutItemText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aboutItem}>
            <Ionicons name="document-text-outline" size={24} color="#6C63FF" />
            <Text style={styles.aboutItemText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveSettings}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetAppData}
          >
            <Text style={styles.resetButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  aboutItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  dataButtonText: {
    fontSize: 16,
    color: '#6C63FF',
    marginLeft: 12,
  },
  lastBackupText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    margin: 16,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
