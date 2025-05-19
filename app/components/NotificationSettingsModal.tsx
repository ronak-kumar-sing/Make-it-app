import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ visible, onClose, theme }) => {
  const [settings, setSettings] = useState({
    tasksDue: true,
    exams: true,
    timerCompleted: true,
    streakReminders: true,
    dailyGoals: true,
    achievements: true,
    // Health-related notification settings
    waterReminders: true,
    activityReminders: true,
    sleepReminders: true,
    moodChecks: true,
  });

  // Load settings on first render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings when they change
  const updateSetting = async (key: string, value: boolean) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(updatedSettings);

    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Notification Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Choose which notifications you'd like to receive:
            </Text>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Task Due Reminders</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Notifications when your tasks are about to be due
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.tasksDue}
                onValueChange={(value) => updateSetting('tasksDue', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="school-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Exam Reminders</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reminders for upcoming exams
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.exams}
                onValueChange={(value) => updateSetting('exams', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="timer-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Timer Alerts</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Notifications when focus/break sessions end
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.timerCompleted}
                onValueChange={(value) => updateSetting('timerCompleted', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="flame-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Streak Reminders</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reminders to maintain your study streak
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.streakReminders}
                onValueChange={(value) => updateSetting('streakReminders', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="bar-chart-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Daily Goals</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reminders to help reach your daily study goals
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.dailyGoals}
                onValueChange={(value) => updateSetting('dailyGoals', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="trophy-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Achievements</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Notifications when you unlock achievements
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.achievements}
                onValueChange={(value) => updateSetting('achievements', value)}
              />
            </View>

            {/* Health Notification Settings Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Reminders</Text>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="water-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Hydration Reminders</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Regular reminders to drink water
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.waterReminders}
                onValueChange={(value) => updateSetting('waterReminders', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="walk-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Movement Breaks</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reminders to move during long study sessions
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.activityReminders}
                onValueChange={(value) => updateSetting('activityReminders', value)}
              />
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Sleep Reminders</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Reminders for healthy sleep habits
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.sleepReminders}
                onValueChange={(value) => updateSetting('sleepReminders', value)}
              />
            </View>

            <View style={[styles.settingRow]}>
              <View style={styles.settingInfo}>
                <Ionicons name="happy-outline" size={22} color={theme.primary} style={styles.icon} />
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Mood Check-ins</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Daily prompts to track your emotional wellbeing
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
                value={settings.moodChecks}
                onValueChange={(value) => updateSetting('moodChecks', value)}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 4,
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationSettingsModal;
