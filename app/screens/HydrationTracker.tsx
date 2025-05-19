/**
 * HydrationTracker.tsx
 *
 * Screen for tracking daily hydration and water intake
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as HealthTrackingService from '../services/HealthTrackingService';

export default function HydrationTracker({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // New water intake entry
  const [waterIntake, setWaterIntake] = useState('');
  const [notes, setNotes] = useState('');

  // History
  const [hydrationHistory, setHydrationHistory] = useState<HealthTrackingService.NutritionEntry[]>([]);

  // Goal
  const [dailyGoal, setDailyGoal] = useState<number>(2500); // Default 2500mL
  const [dailyTotal, setDailyTotal] = useState<number>(0);

  useEffect(() => {
    loadHydrationHistory();
    loadHydrationGoal();
  }, []);

  const loadHydrationHistory = async () => {
    try {
      // Get the last 7 days of hydration data
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const history = await HealthTrackingService.getNutritionEntries(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      setHydrationHistory(history);

      // Calculate today's total
      const todayStr = today.toISOString().split('T')[0];
      const todayEntries = history.filter(entry => entry.date === todayStr);
      const total = todayEntries.reduce((sum, entry) => sum + entry.waterIntake, 0);
      setDailyTotal(total);
    } catch (error) {
      console.error('Error loading hydration history:', error);
      Alert.alert('Error', 'Failed to load hydration history.');
    }
  };

  const loadHydrationGoal = async () => {
    try {
      const goals = await HealthTrackingService.getHealthGoals();
      setDailyGoal(goals.waterIntake);
    } catch (error) {
      console.error('Error loading hydration goal:', error);
    }
  };

  const handleAddWaterIntake = async () => {
    try {
      setLoading(true);

      const waterIntakeValue = parseInt(waterIntake);
      if (isNaN(waterIntakeValue) || waterIntakeValue <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid water intake value in mL.');
        setLoading(false);
        return;
      }

      const now = new Date();
      const nutritionEntry: Partial<HealthTrackingService.NutritionEntry> = {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substr(0, 5),
        waterIntake: waterIntakeValue,
        foodItems: [],
        notes: notes.trim(),
      };

      await HealthTrackingService.logNutritionEntry(nutritionEntry);

      // Reset fields
      setWaterIntake('');
      setNotes('');

      // Refresh history
      await loadHydrationHistory();

      Alert.alert('Success', 'Water intake tracked successfully!');
    } catch (error) {
      console.error('Error adding water intake:', error);
      Alert.alert('Error', 'Failed to save water intake data.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.min(100, Math.round((dailyTotal / dailyGoal) * 100));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Hydration Tracker</Text>
      </View>

      {/* Progress indicator */}
      <View style={[styles.goalContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.goalTitle, { color: theme.text }]}>
          Today's Progress: {dailyTotal}mL / {dailyGoal}mL
        </Text>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.primary,
                width: `${getProgressPercentage()}%`
              }
            ]}
          />
        </View>

        <Text style={[styles.goalPercentage, { color: theme.primary }]}>
          {getProgressPercentage()}%
        </Text>
      </View>

      {/* Add new water intake */}
      <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Add Water Intake</Text>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Water intake (mL)"
              placeholderTextColor={theme.textLight}
              keyboardType="numeric"
              value={waterIntake}
              onChangeText={setWaterIntake}
            />
          </View>

          <Text style={[styles.inputLabel, { color: theme.text }]}>mL</Text>
        </View>

        <View style={[styles.notesContainer, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Notes (optional)"
            placeholderTextColor={theme.textLight}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAddWaterIntake}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addButtonText}>Add Water Intake</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick add buttons */}
      <View style={[styles.quickAddContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Quick Add</Text>

        <View style={styles.quickButtonsRow}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setWaterIntake('200')}
          >
            <Text style={[styles.quickButtonText, { color: theme.primary }]}>200 mL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setWaterIntake('300')}
          >
            <Text style={[styles.quickButtonText, { color: theme.primary }]}>300 mL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setWaterIntake('500')}
          >
            <Text style={[styles.quickButtonText, { color: theme.primary }]}>500 mL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History */}
      <View style={[styles.historyContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Recent History</Text>

        {hydrationHistory.length === 0 ? (
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No hydration data recorded yet
          </Text>
        ) : (
          hydrationHistory.map((entry, index) => (
            <View key={entry.id || index} style={[styles.historyItem, { borderColor: theme.border }]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
                  {entry.time}
                </Text>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyMetric}>
                  <Ionicons name="water-outline" size={16} color={theme.primary} />
                  <Text style={[styles.historyMetricText, { color: theme.text }]}>
                    {entry.waterIntake} mL
                  </Text>
                </View>
              </View>

              {entry.notes && (
                <Text style={[styles.historyNotes, { color: theme.textSecondary }]}>
                  {entry.notes}
                </Text>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.viewMoreButton, { borderColor: theme.border }]}
          onPress={() => navigation.navigate('ActivityHistory', { tab: 'Nutrition' })}
        >
          <Text style={[styles.viewMoreText, { color: theme.primary }]}>
            View Complete History
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 20,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  input: {
    fontSize: 16,
  },
  notesContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    minHeight: 80,
  },
  addButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickAddContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '30%',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyTime: {
    fontSize: 14,
  },
  historyDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  historyMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyMetricText: {
    fontSize: 15,
    marginLeft: 4,
  },
  historyNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  viewMoreButton: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
