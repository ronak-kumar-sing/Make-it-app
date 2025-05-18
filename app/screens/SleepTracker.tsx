/**
 * SleepTracker.tsx
 * Screen for tracking sleep patterns and quality
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as HealthTrackingService from '../services/HealthTrackingService';

export default function SleepTracker({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // Date picker state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time picker state
  const [bedTime, setBedTime] = useState(new Date(date.setHours(22, 0, 0, 0)));
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [wakeTime, setWakeTime] = useState(new Date(date.setHours(7, 0, 0, 0)));
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  // Sleep quality rating
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Additional notes
  const [notes, setNotes] = useState('');

  // History
  const [sleepHistory, setSleepHistory] = useState<HealthTrackingService.SleepEntry[]>([]);

  useEffect(() => {
    loadSleepHistory();
  }, []);

  const loadSleepHistory = async () => {
    try {
      // Get the last 7 days of sleep data
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const history = await HealthTrackingService.getSleepEntries(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      setSleepHistory(history);
    } catch (error) {
      console.error('Error loading sleep history:', error);
      Alert.alert('Error', 'Failed to load sleep history.');
    }
  };

  const calculateSleepDuration = () => {
    let sleepMinutes = 0;

    // If wake time is before bed time, it means the person slept past midnight
    if (wakeTime < bedTime) {
      const nextDay = new Date(wakeTime);
      nextDay.setDate(nextDay.getDate() + 1);
      sleepMinutes = (nextDay.getTime() - bedTime.getTime()) / (1000 * 60);
    } else {
      sleepMinutes = (wakeTime.getTime() - bedTime.getTime()) / (1000 * 60);
    }

    return Math.round(sleepMinutes);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const sleepDuration = calculateSleepDuration();

      const sleepEntry: HealthTrackingService.SleepEntry = {
        id: `sleep_${Date.now()}`,
        date: format(date, 'yyyy-MM-dd'),
        bedTime: format(bedTime, 'HH:mm'),
        wakeTime: format(wakeTime, 'HH:mm'),
        duration: sleepDuration,
        quality: quality,
        notes: notes || undefined
      };

      const success = await HealthTrackingService.addSleepEntry(sleepEntry);

      if (success) {
        Alert.alert('Success', 'Sleep data recorded successfully!');

        // Reset form
        setNotes('');
        setQuality(3);

        // Refresh history
        await loadSleepHistory();
      } else {
        Alert.alert('Error', 'Failed to save sleep data.');
      }
    } catch (error) {
      console.error('Error saving sleep data:', error);
      Alert.alert('Error', 'Failed to save sleep data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // Time picker handlers
  const onBedTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || bedTime;
    setShowBedTimePicker(Platform.OS === 'ios');
    setBedTime(currentTime);
  };

  const onWakeTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || wakeTime;
    setShowWakeTimePicker(Platform.OS === 'ios');
    setWakeTime(currentTime);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to determine sleep quality text and icon
  const getSleepQualityInfo = (qualityRating: 1 | 2 | 3 | 4 | 5) => {
    switch (qualityRating) {
      case 1:
        return { text: 'Poor', icon: 'sad-outline' };
      case 2:
        return { text: 'Fair', icon: 'remove-outline' };
      case 3:
        return { text: 'Good', icon: 'happy-outline' };
      case 4:
        return { text: 'Very Good', icon: 'thumbs-up-outline' };
      case 5:
        return { text: 'Excellent', icon: 'star-outline' };
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Sleep Tracker</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Record Sleep</Text>

        {/* Date selection */}
        <TouchableOpacity
          style={[styles.dateSelector, { borderColor: theme.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={24} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {format(date, 'EEEE, MMM d, yyyy')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Time selection */}
        <View style={styles.timeContainer}>
          <View style={styles.timeSection}>
            <Text style={[styles.label, { color: theme.text }]}>Bed Time</Text>
            <TouchableOpacity
              style={[styles.timeSelector, { borderColor: theme.border }]}
              onPress={() => setShowBedTimePicker(true)}
            >
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.timeText, { color: theme.text }]}>
                {format(bedTime, 'h:mm a')}
              </Text>
            </TouchableOpacity>

            {showBedTimePicker && (
              <DateTimePicker
                value={bedTime}
                mode="time"
                display="default"
                onChange={onBedTimeChange}
              />
            )}
          </View>

          <View style={styles.timeSection}>
            <Text style={[styles.label, { color: theme.text }]}>Wake Time</Text>
            <TouchableOpacity
              style={[styles.timeSelector, { borderColor: theme.border }]}
              onPress={() => setShowWakeTimePicker(true)}
            >
              <Ionicons name="sunny-outline" size={24} color={theme.primary} />
              <Text style={[styles.timeText, { color: theme.text }]}>
                {format(wakeTime, 'h:mm a')}
              </Text>
            </TouchableOpacity>

            {showWakeTimePicker && (
              <DateTimePicker
                value={wakeTime}
                mode="time"
                display="default"
                onChange={onWakeTimeChange}
              />
            )}
          </View>
        </View>

        {/* Sleep duration calculation */}
        <View style={styles.durationContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Sleep Duration</Text>
          <Text style={[styles.durationText, { color: theme.accent }]}>
            {formatDuration(calculateSleepDuration())}
          </Text>
        </View>

        {/* Sleep quality rating */}
        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Sleep Quality</Text>
        <View style={styles.qualityContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.qualityOption,
                {
                  backgroundColor: quality === rating ? theme.primary : 'transparent',
                  borderColor: theme.primary
                }
              ]}
              onPress={() => setQuality(rating as 1 | 2 | 3 | 4 | 5)}
            >
              <Text
                style={[
                  styles.qualityText,
                  { color: quality === rating ? theme.cardLight : theme.text }
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.qualityLabel, { color: theme.textLight }]}>
          {getSleepQualityInfo(quality).text}
        </Text>

        {/* Notes input */}
        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Notes</Text>
        <TextInput
          style={[
            styles.notesInput,
            {
              color: theme.text,
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
          placeholder="How did you sleep? Any dreams or disturbances?"
          placeholderTextColor={theme.textLight}
          multiline={true}
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: theme.cardLight }]}>
            {loading ? 'Saving...' : 'Save Sleep Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sleep history */}
      <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20 }]}>
        <View style={styles.historyHeader}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Recent Sleep History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ActivityHistory', { tab: 'sleep' })}>
            <Text style={[styles.viewAllText, { color: theme.accent }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {sleepHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={40} color={theme.textLight} />
            <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
              No sleep data recorded yet. Start tracking your sleep to see history here.
            </Text>
          </View>
        ) : (
          sleepHistory.map((entry) => (
            <View key={entry.id} style={[styles.historyItem, { borderColor: theme.border }]}>
              <View style={styles.historyItemHeader}>
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </Text>
                <View style={styles.qualityBadge}>
                  <Ionicons
                    name={getSleepQualityInfo(entry.quality).icon}
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.qualityBadgeText, { color: theme.primary }]}>
                    {getSleepQualityInfo(entry.quality).text}
                  </Text>
                </View>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyDetail}>
                  <Ionicons name="time-outline" size={16} color={theme.textLight} />
                  <Text style={[styles.historyDetailText, { color: theme.text }]}>
                    {entry.bedTime} - {entry.wakeTime}
                  </Text>
                </View>

                <View style={styles.historyDetail}>
                  <Ionicons name="hourglass-outline" size={16} color={theme.textLight} />
                  <Text style={[styles.historyDetailText, { color: theme.text }]}>
                    {formatDuration(entry.duration)}
                  </Text>
                </View>
              </View>

              {entry.notes && (
                <Text style={[styles.historyNotes, { color: theme.textLight }]}>
                  {entry.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Sleep tips */}
      <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20, marginBottom: 20 }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Sleep Tips</Text>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Aim for 7-9 hours of quality sleep per night for optimal cognitive function.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="time-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Maintain a consistent sleep schedule, even on weekends, to regulate your body's clock.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="phone-portrait-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Avoid screens 1 hour before bedtime. Blue light can disrupt melatonin production.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="cafe-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Avoid caffeine at least 6 hours before bedtime to ensure it doesn't interfere with sleep.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeSection: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 10,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  qualityOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qualityLabel: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  historyItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityBadgeText: {
    marginLeft: 4,
    fontSize: 12,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDetailText: {
    marginLeft: 6,
    fontSize: 14,
  },
  historyNotes: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },
});
