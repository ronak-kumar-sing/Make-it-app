import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import StreakCalendar from '../components/StreakCalendar';

const StreaksScreen = () => {
  const { streaks, stats } = useContext(AppContext);
  
  // Calculate streak statistics
  const totalStudyDays = Object.keys(streaks.studyDays).length;
  const averageStudyTime = totalStudyDays > 0
    ? Math.round(stats.totalStudyTime / totalStudyDays)
    : 0;
  
  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Calculate current month study days
  const currentMonthDays = Object.keys(streaks.studyDays).filter(date => {
    const month = new Date(date).getMonth();
    const currentMonthNum = new Date().getMonth();
    return month === currentMonthNum;
  }).length;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Study Streaks</Text>
        </View>
        
        <View style={styles.streakBanner}>
          <View style={styles.streakIconContainer}>
            <Ionicons name="flame" size={48} color="#FF6B6B" />
            <Text style={styles.streakCount}>{streaks.current}</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakTitle}>Current Streak</Text>
            <Text style={styles.streakSubtitle}>
              {streaks.current === 1 ? '1 day' : `${streaks.current} days`}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streaks.longest}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStudyDays}</Text>
            <Text style={styles.statLabel}>Total Study Days</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentMonthDays}</Text>
            <Text style={styles.statLabel}>{currentMonth}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Calendar</Text>
          <StreakCalendar studyDays={streaks.studyDays} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Stats</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color="#6C63FF" />
              <View style={styles.statItemText}>
                <Text style={styles.statItemLabel}>Total Study Time</Text>
                <Text style={styles.statItemValue}>
                  {stats.totalStudyTime} minutes
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="calculator-outline" size={24} color="#6C63FF" />
              <View style={styles.statItemText}>
                <Text style={styles.statItemLabel}>Average Daily Study Time</Text>
                <Text style={styles.statItemValue}>
                  {averageStudyTime} minutes
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#6C63FF" />
              <View style={styles.statItemText}>
                <Text style={styles.statItemLabel}>Tasks Completed</Text>
                <Text style={styles.statItemValue}>
                  {stats.tasksCompleted}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="timer-outline" size={24} color="#6C63FF" />
              <View style={styles.statItemText}>
                <Text style={styles.statItemLabel}>Focus Sessions</Text>
                <Text style={styles.statItemValue}>
                  {stats.sessionsCompleted}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          
          <View style={styles.achievementsContainer}>
            <View style={[
              styles.achievement,
              streaks.longest >= 3 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="trophy"
                size={32}
                color={streaks.longest >= 3 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>3-Day Streak</Text>
            </View>
            
            <View style={[
              styles.achievement,
              streaks.longest >= 7 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="trophy"
                size={32}
                color={streaks.longest >= 7 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>7-Day Streak</Text>
            </View>
            
            <View style={[
              styles.achievement,
              streaks.longest >= 14 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="trophy"
                size={32}
                color={streaks.longest >= 14 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>14-Day Streak</Text>
            </View>
            
            <View style={[
              styles.achievement,
              streaks.longest >= 30 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="trophy"
                size={32}
                color={streaks.longest >= 30 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>30-Day Streak</Text>
            </View>
            
            <View style={[
              styles.achievement,
              stats.totalStudyTime >= 600 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="time"
                size={32}
                color={stats.totalStudyTime >= 600 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>10 Hours</Text>
            </View>
            
            <View style={[
              styles.achievement,
              stats.tasksCompleted >= 50 ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={stats.tasksCompleted >= 50 ? "#FFD700" : "#CCCCCC"}
              />
              <Text style={styles.achievementTitle}>50 Tasks</Text>
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
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  streakIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakCount: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  statRow: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    marginLeft: 12,
    flex: 1,
  },
  statItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievement: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementUnlocked: {
    backgroundColor: '#FFF9E6',
  },
  achievementLocked: {
    backgroundColor: '#F0F0F0',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default StreaksScreen;