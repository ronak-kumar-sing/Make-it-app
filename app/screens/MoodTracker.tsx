/**
 * MoodTracker.tsx
 * Screen for tracking mood and stress levels
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as HealthTrackingService from '../services/HealthTrackingService';

// Emoji mapping for moods
const MOOD_EMOJIS = {
  'terrible': '😞',
  'bad': '😔',
  'neutral': '😐',
  'good': '😊',
  'excellent': '😁'
};

export default function MoodTracker({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // Date picker state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time picker state
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Mood and stress level
  const [mood, setMood] = useState<'terrible' | 'bad' | 'neutral' | 'good' | 'excellent'>('neutral');
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Study-related toggle
  const [isStudyRelated, setIsStudyRelated] = useState(false);

  // Additional notes
  const [notes, setNotes] = useState('');

  // History
  const [moodHistory, setMoodHistory] = useState<HealthTrackingService.MoodEntry[]>([]);

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    try {
      // Get the last 7 days of mood data
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const history = await HealthTrackingService.getMoodEntries(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      setMoodHistory(history);
    } catch (error) {
      console.error('Error loading mood history:', error);
      Alert.alert('Error', 'Failed to load mood history.');
    }
  };

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // Time picker handlers
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const moodEntry: HealthTrackingService.MoodEntry = {
        id: `mood_${Date.now()}`,
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
        mood: mood,
        stressLevel: stressLevel,
        studyRelated: isStudyRelated,
        notes: notes || undefined
      };

      const success = await HealthTrackingService.addMoodEntry(moodEntry);

      if (success) {
        Alert.alert('Success', 'Mood data recorded successfully!');

        // Reset form (except date and time)
        setMood('neutral');
        setStressLevel(3);
        setIsStudyRelated(false);
        setNotes('');

        // Refresh history
        await loadMoodHistory();
      } else {
        Alert.alert('Error', 'Failed to save mood data.');
      }
    } catch (error) {
      console.error('Error saving mood data:', error);
      Alert.alert('Error', 'Failed to save mood data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get textual description of stress level
  const getStressDescription = (level: 1 | 2 | 3 | 4 | 5) => {
    switch (level) {
      case 1:
        return 'Very Low';
      case 2:
        return 'Low';
      case 3:
        return 'Moderate';
      case 4:
        return 'High';
      case 5:
        return 'Very High';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mood Tracker</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>How are you feeling?</Text>

        {/* Date and Time selection */}
        <View style={styles.dateTimeContainer}>
          {/* Date selection */}
          <TouchableOpacity
            style={[styles.dateSelector, { borderColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {format(date, 'MMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          {/* Time selection */}
          <TouchableOpacity
            style={[styles.dateSelector, { borderColor: theme.border }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {format(time, 'h:mm a')}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Mood selection */}
        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Select Your Mood</Text>
        <View style={styles.moodContainer}>
          {(['terrible', 'bad', 'neutral', 'good', 'excellent'] as const).map((moodOption) => (
            <TouchableOpacity
              key={moodOption}
              style={[
                styles.moodOption,
                {
                  backgroundColor: mood === moodOption ? theme.primary : 'transparent',
                  borderColor: theme.primary
                }
              ]}
              onPress={() => setMood(moodOption)}
            >
              <Text style={styles.moodEmoji}>{MOOD_EMOJIS[moodOption]}</Text>
              <Text
                style={[
                  styles.moodText,
                  { color: mood === moodOption ? theme.cardLight : theme.text }
                ]}
              >
                {moodOption.charAt(0).toUpperCase() + moodOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stress level selection */}
        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Stress Level</Text>
        <View style={styles.stressContainer}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.stressOption,
                {
                  backgroundColor: stressLevel === level ? theme.primary : 'transparent',
                  borderColor: theme.primary
                }
              ]}
              onPress={() => setStressLevel(level as 1 | 2 | 3 | 4 | 5)}
            >
              <Text
                style={[
                  styles.stressText,
                  { color: stressLevel === level ? theme.cardLight : theme.text }
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.stressDescription, { color: theme.textLight }]}>
          {getStressDescription(stressLevel)}
        </Text>

        {/* Study-related toggle */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.label, { color: theme.text, flex: 1 }]}>
            Is this related to your studies?
          </Text>
          <Switch
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={isStudyRelated ? theme.primary : theme.textLight}
            onValueChange={setIsStudyRelated}
            value={isStudyRelated}
          />
        </View>

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
          placeholder="What's affecting your mood? Any triggers or events?"
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
            {loading ? 'Saving...' : 'Save Mood Entry'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood history */}
      <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20 }]}>
        <View style={styles.historyHeader}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Recent Mood History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ActivityHistory', { tab: 'mood' })}>
            <Text style={[styles.viewAllText, { color: theme.accent }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {moodHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="happy-outline" size={40} color={theme.textLight} />
            <Text style={[styles.emptyStateText, { color: theme.textLight }]}>
              No mood data recorded yet. Start tracking your mood to see history here.
            </Text>
          </View>
        ) : (
          moodHistory.map((entry) => (
            <View key={entry.id} style={[styles.historyItem, { borderColor: theme.border }]}>
              <View style={styles.historyItemHeader}>
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {format(new Date(entry.date), 'MMM d')} at {entry.time}
                </Text>
                <View style={styles.moodBadge}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJIS[entry.mood]}</Text>
                  <Text style={[styles.moodBadgeText, { color: theme.primary }]}>
                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.historyDetail}>
                  <Ionicons name="pulse-outline" size={16} color={theme.textLight} />
                  <Text style={[styles.historyDetailText, { color: theme.text }]}>
                    Stress: {getStressDescription(entry.stressLevel)}
                  </Text>
                </View>

                {entry.studyRelated && (
                  <View style={[styles.studyTag, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="book-outline" size={14} color={theme.primary} />
                    <Text style={[styles.studyTagText, { color: theme.primary }]}>
                      Study
                    </Text>
                  </View>
                )}
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

      {/* Mindfulness tips */}
      <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20, marginBottom: 20 }]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Mindfulness Tips</Text>
        <View style={styles.tipItem}>
          <Ionicons name="leaf-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Practice deep breathing for 5 minutes when feeling stressed to activate your body's relaxation response.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="water-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Take short mindfulness breaks between study sessions. Even 2 minutes of mindful awareness can reset your focus.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="body-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Notice physical signs of stress like tense shoulders or jaw clenching. These can be signals to take a break.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="sunny-outline" size={24} color={theme.accent} />
          <Text style={[styles.tipText, { color: theme.text }]}>
            Start your day with a positive affirmation or intention to set the tone for your mood.
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
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    width: '48%',
  },
  dateText: {
    fontSize: 14,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  moodOption: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 10,
    textAlign: 'center',
  },
  stressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  stressOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stressDescription: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
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
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDetailText: {
    marginLeft: 6,
    fontSize: 14,
  },
  studyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  studyTagText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
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
