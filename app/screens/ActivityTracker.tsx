/**
 * ActivityTracker.tsx
 * Screen for tracking daily activities and exercises
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as HealthTrackingService from '../services/HealthTrackingService';

export default function ActivityTracker({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // New activity entry
  const [steps, setSteps] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutIntensity, setWorkoutIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [isStudyBreak, setIsStudyBreak] = useState(false);

  // History
  const [activityHistory, setActivityHistory] = useState<HealthTrackingService.ActivityEntry[]>([]);

  useEffect(() => {
    loadActivityHistory();
  }, []);

  const loadActivityHistory = async () => {
    try {
      // Get the last 7 days of activity
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const history = await HealthTrackingService.getActivityEntries(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      setActivityHistory(history);
    } catch (error) {
      console.error('Error loading activity history:', error);
      Alert.alert('Error', 'Failed to load activity history.');
    }
  };

  const handleSave = async () => {
    if (!steps) {
      Alert.alert('Missing Data', 'Please enter at least your step count for today.');
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const activityEntry: HealthTrackingService.ActivityEntry = {
        id: `activity_${Date.now()}`,
        date: today.toISOString().split('T')[0],
        steps: parseInt(steps),
        activeMinutes: parseInt(activeMinutes) || 0,
        workoutType: workoutType || undefined,
        workoutDuration: workoutDuration ? parseInt(workoutDuration) : undefined,
        workoutIntensity: workoutType ? workoutIntensity : undefined,
        notes: notes || undefined
      };

      const success = await HealthTrackingService.addActivityEntry(activityEntry);

      if (success) {
        Alert.alert('Success', 'Activity recorded successfully!');

        // Reset form
        setSteps('');
        setActiveMinutes('');
        setWorkoutType('');
        setWorkoutDuration('');
        setWorkoutIntensity('medium');
        setNotes('');
        setIsStudyBreak(false);

        // Refresh history
        await loadActivityHistory();
      } else {
        Alert.alert('Error', 'Failed to save activity data.');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving activity data.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Activity Tracker</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Record your daily physical activity
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Activity</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Steps</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={steps}
            onChangeText={setSteps}
            placeholder="Enter your step count"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Active Minutes</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={activeMinutes}
            onChangeText={setActiveMinutes}
            placeholder="Minutes spent being active"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Workout Type (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={workoutType}
            onChangeText={setWorkoutType}
            placeholder="e.g., Walking, Yoga, Running"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {workoutType ? (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Workout Duration (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={workoutDuration}
                onChangeText={setWorkoutDuration}
                placeholder="Duration in minutes"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Intensity</Text>
              <View style={styles.intensityContainer}>
                <TouchableOpacity
                  style={[
                    styles.intensityOption,
                    { borderColor: theme.border },
                    workoutIntensity === 'low' && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setWorkoutIntensity('low')}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      { color: workoutIntensity === 'low' ? '#fff' : theme.text }
                    ]}
                  >
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.intensityOption,
                    { borderColor: theme.border },
                    workoutIntensity === 'medium' && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setWorkoutIntensity('medium')}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      { color: workoutIntensity === 'medium' ? '#fff' : theme.text }
                    ]}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.intensityOption,
                    { borderColor: theme.border },
                    workoutIntensity === 'high' && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setWorkoutIntensity('high')}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      { color: workoutIntensity === 'high' ? '#fff' : theme.text }
                    ]}
                  >
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about your activity"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            Study Break Activity
          </Text>
          <Switch
            value={isStudyBreak}
            onValueChange={setIsStudyBreak}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={isStudyBreak ? theme.primary : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save Activity</Text>
          )}
        </TouchableOpacity>
      </View>

      {activityHistory.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recent Activity</Text>

          {activityHistory.map((activity) => (
            <View
              key={activity.id}
              style={[styles.historyItem, { borderBottomColor: theme.border }]}
            >
              <View style={styles.historyHeader}>
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {formatDate(activity.date)}
                </Text>
                {activity.workoutType && (
                  <View style={[styles.workoutTag, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.workoutTagText, { color: theme.primary }]}>
                      {activity.workoutType}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyDetailItem}>
                  <Ionicons name="footsteps-outline" size={20} color={theme.primary} />
                  <Text style={[styles.historyDetailText, { color: theme.textSecondary }]}>
                    {activity.steps} steps
                  </Text>
                </View>

                <View style={styles.historyDetailItem}>
                  <Ionicons name="time-outline" size={20} color={theme.primary} />
                  <Text style={[styles.historyDetailText, { color: theme.textSecondary }]}>
                    {activity.activeMinutes} mins active
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: theme.primary }]}
            onPress={() => navigation.navigate('ActivityHistory')}
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View Full History</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Activity Tips</Text>

        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={24} color={theme.primary} style={styles.tipIcon} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Taking short breaks during study sessions to move around can improve focus and retention.
          </Text>
        </View>

        <View style={styles.tip}>
          <Ionicons name="walk-outline" size={24} color={theme.primary} style={styles.tipIcon} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Aim for at least 7,500 steps daily for optimal cognitive benefits.
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  intensityText: {
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  workoutTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyDetails: {
    flexDirection: 'row',
  },
  historyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyDetailText: {
    marginLeft: 4,
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewAllText: {
    fontWeight: '500',
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipText: {
    flex: 1,
  },
});
