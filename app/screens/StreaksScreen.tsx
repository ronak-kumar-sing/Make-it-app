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
import StreakCalendar from '../components/StreakCalendar';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const StreaksScreen = () => {
  const { theme } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Study Streaks</Text>
      </View>

      <ScrollView>
        <View style={styles.streakCards}>
          <View style={[styles.streakCard, { backgroundColor: theme.card }]}>
            <View style={[styles.streakIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="flame" size={24} color={theme.warning} />
            </View>
            <Text style={[styles.streakCount, { color: theme.text }]}>{streaks.current}</Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Current Streak</Text>
          </View>

          <View style={[styles.streakCard, { backgroundColor: theme.card }]}>
            <View style={[styles.streakIconContainer, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="trophy" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.streakCount, { color: theme.text }]}>{streaks.longest}</Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>Longest Streak</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Study Goal</Text>
          <Text style={[styles.goalText, { color: theme.text }]}>
            {settings.dailyGoalMinutes / 60} hours per day
          </Text>

          <View style={[styles.goalRow, { borderTopColor: theme.border }]}>
            <View style={styles.goalStat}>
              <Text style={[styles.goalStatValue, { color: theme.primary }]}>{(weekTotal / 60).toFixed(1)}</Text>
              <Text style={[styles.goalStatLabel, { color: theme.textSecondary }]}>Hours this week</Text>
            </View>

            <View style={styles.goalStat}>
              <Text style={[styles.goalStatValue, { color: theme.primary }]}>{(dailyAverage / 60).toFixed(1)}</Text>
              <Text style={[styles.goalStatLabel, { color: theme.textSecondary }]}>Daily average (hrs)</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last 7 Days</Text>

          {last7Days.map(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            const minutes = streaks.studyDays?.[dateString] || 0;
            const progress = minutes / settings.dailyGoalMinutes;

            return (
              <View key={dateString} style={styles.dayRow}>
                <Text style={[styles.dayName, { color: theme.text }]}>{format(date, 'E')}</Text>
                <Text style={[styles.dayDate, { color: theme.textSecondary }]}>{format(date, 'MMM d')}</Text>

                <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(progress * 100, 100)}%` },
                      minutes >= settings.dailyGoalMinutes
                        ? { backgroundColor: theme.success }
                        : { backgroundColor: theme.primary }
                    ]}
                  />
                </View>

                <Text style={[styles.minutesText, { color: theme.text }]}>{(minutes / 60).toFixed(1)} hrs</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Calendar</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Track your study consistency throughout the month
          </Text>

          <StreakCalendar studyDays={streaks.studyDays} theme={theme} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Streak Tips</Text>

          <View style={[styles.tipCard, { backgroundColor: theme.background }]}>
            <Ionicons name="bulb-outline" size={24} color={theme.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Consistency is Key</Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                Study a little bit every day, even if it's just for 10-15 minutes.
                Regular practice leads to better retention and builds good habits.
              </Text>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: theme.background }]}>
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Set a Daily Schedule</Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                Try to study at the same time each day to establish a routine.
                This helps make studying a natural part of your day.
              </Text>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: theme.background }]}>
            <Ionicons name="create-outline" size={24} color={theme.primary} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Track Your Progress</Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
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
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakCards: {
    flexDirection: 'row',
    padding: 16,
  },
  streakCard: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  goalText: {
    fontSize: 16,
    marginBottom: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  goalStat: {
    flex: 1,
    alignItems: 'center',
  },
  goalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalStatLabel: {
    fontSize: 14,
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
  },
  dayDate: {
    width: 60,
    fontSize: 14,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  minutesText: {
    width: 50,
    fontSize: 14,
    textAlign: 'right',
  },
  tipCard: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default StreaksScreen;