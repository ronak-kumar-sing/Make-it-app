import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useContext } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StreakCalendar from '../../components/StreakCalendar';
import { AppContext } from '../context';

const StreaksScreen = () => {
  const { streaks, settings } = useContext(AppContext);

  // Get dates for this week
  const getLast7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }

    return days;
  };

  const last7Days = getLast7Days();

  // Get total minutes for a date
  const getMinutesForDay = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return streaks.studyDays?.[dateString] || 0;
  };

  // Calculate week total
  const weekTotal = last7Days.reduce((total, date) => {
    return total + getMinutesForDay(date);
  }, 0);

  // Calculate average per day
  const dailyAverage = Math.round(weekTotal / 7);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Study Streaks</Text>
      </View>

      <ScrollView>
        <View style={styles.streakCards}>
          <View style={styles.streakCard}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame" size={24} color="#FF9800" />
            </View>
            <Text style={styles.streakCount}>{streaks.current}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="trophy" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.streakCount}>{streaks.longest}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Study Goal</Text>
          <Text style={styles.goalText}>
            {settings.dailyGoalMinutes} minutes per day
          </Text>

          <View style={styles.goalRow}>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatValue}>{weekTotal}</Text>
              <Text style={styles.goalStatLabel}>Minutes this week</Text>
            </View>

            <View style={styles.goalStat}>
              <Text style={styles.goalStatValue}>{dailyAverage}</Text>
              <Text style={styles.goalStatLabel}>Daily average</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>

          {last7Days.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const minutes = streaks.studyDays?.[dateString] || 0;
            const progress = minutes / settings.dailyGoalMinutes;

            return (
              <View key={dateString} style={styles.dayRow}>
                <Text style={styles.dayName}>{format(date, 'E')}</Text>
                <Text style={styles.dayDate}>{format(date, 'MMM d')}</Text>

                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(progress * 100, 100)}%` },
                      minutes >= settings.dailyGoalMinutes ? styles.progressComplete : styles.progressIncomplete
                    ]}
                  />
                </View>

                <Text style={styles.minutesText}>{minutes} min</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Calendar</Text>
          <Text style={styles.sectionDescription}>
            Track your study consistency throughout the month
          </Text>

          <StreakCalendar studyDays={streaks.studyDays} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Tips</Text>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={24} color="#6C63FF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Consistency is Key</Text>
              <Text style={styles.tipText}>
                Study a little bit every day, even if it's just for 10-15 minutes.
                Regular practice leads to better retention and builds good habits.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="time-outline" size={24} color="#6C63FF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Set a Daily Schedule</Text>
              <Text style={styles.tipText}>
                Try to study at the same time each day to establish a routine.
                This helps make studying a natural part of your day.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="create-outline" size={24} color="#6C63FF" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track Your Progress</Text>
              <Text style={styles.tipText}>
                Keeping track of your study streaks provides motivation and
                shows your commitment to learning and self-improvement.
              </Text>
            </View>
          </View>
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
  streakCards: {
    flexDirection: 'row',
    padding: 16,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  streakIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  goalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  goalStat: {
    flex: 1,
    alignItems: 'center',
  },
  goalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  goalStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dayName: {
    width: 40,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dayDate: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressComplete: {
    backgroundColor: '#4CAF50',
  },
  progressIncomplete: {
    backgroundColor: '#6C63FF',
  },
  minutesText: {
    width: 50,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  tipContent: {
    marginLeft: 16,
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default StreaksScreen;
