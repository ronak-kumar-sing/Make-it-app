import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const AchievementsScreen = () => {
  const { achievements, stats, streaks } = useContext(AppContext);
  const { theme } = useTheme();

  // Define all achievements
  const achievementsList = [
    {
      id: 'streak_3',
      title: '3-Day Streak',
      description: 'Maintain a study streak for 3 consecutive days',
      icon: 'flame',
      color: '#FF9800',
      progress: achievements.progress?.streak_3 || 0,
      threshold: 3,
    },
    {
      id: 'streak_7',
      title: '7-Day Streak',
      description: 'Maintain a study streak for 7 consecutive days',
      icon: 'flame',
      color: '#FF9800',
      progress: achievements.progress?.streak_7 || 0,
      threshold: 7,
    },
    {
      id: 'streak_14',
      title: '14-Day Streak',
      description: 'Maintain a study streak for 14 consecutive days',
      icon: 'flame',
      color: '#FF9800',
      progress: achievements.progress?.streak_14 || 0,
      threshold: 14,
    },
    {
      id: 'streak_30',
      title: '30-Day Streak',
      description: 'Maintain a study streak for 30 consecutive days',
      icon: 'flame',
      color: '#FF9800',
      progress: achievements.progress?.streak_30 || 0,
      threshold: 30,
    },
    {
      id: 'study_time_10h',
      title: '10 Hours of Study',
      description: 'Complete a total of 10 hours of focused study time',
      icon: 'time',
      color: '#2196F3',
      progress: stats.totalStudyTime,
      threshold: 600, // 10 hours in minutes
    },
    {
      id: 'study_time_50h',
      title: '50 Hours of Study',
      description: 'Complete a total of 50 hours of focused study time',
      icon: 'time',
      color: '#2196F3',
      progress: stats.totalStudyTime,
      threshold: 3000, // 50 hours in minutes
    },
    {
      id: 'tasks_completed_50',
      title: '50 Tasks Completed',
      description: 'Complete 50 study tasks',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      progress: stats.tasksCompleted,
      threshold: 50,
    },
    {
      id: 'tasks_completed_100',
      title: '100 Tasks Completed',
      description: 'Complete 100 study tasks',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      progress: stats.tasksCompleted,
      threshold: 100,
    },
    {
      id: 'sessions_completed_20',
      title: '20 Focus Sessions',
      description: 'Complete 20 focus sessions',
      icon: 'timer',
      color: '#9C27B0',
      progress: stats.sessionsCompleted,
      threshold: 20,
    },
    {
      id: 'sessions_completed_50',
      title: '50 Focus Sessions',
      description: 'Complete 50 focus sessions',
      icon: 'timer',
      color: '#9C27B0',
      progress: stats.sessionsCompleted,
      threshold: 50,
    },
  ];

  // Group achievements by category
  const groupedAchievements = achievementsList.reduce((groups, achievement) => {
    let category;

    if (achievement.id.startsWith('streak')) {
      category = 'Streaks';
    } else if (achievement.id.startsWith('study_time')) {
      category = 'Study Time';
    } else if (achievement.id.startsWith('tasks')) {
      category = 'Tasks';
    } else if (achievement.id.startsWith('sessions')) {
      category = 'Focus Sessions';
    } else {
      category = 'Other';
    }

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(achievement);
    return groups;
  }, {});

  // Calculate achievement stats
  const totalAchievements = achievementsList.length;
  const unlockedAchievements = achievements.unlocked?.length || 0;
  const achievementPercentage = Math.round((unlockedAchievements / totalAchievements) * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressCircle, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.progressText, { color: theme.primary }]}>{achievementPercentage}%</Text>
            </View>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Completed</Text>
          </View>

          <View style={styles.statsDetails}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{unlockedAchievements}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Unlocked</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalAchievements - unlockedAchievements}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Locked</Text>
            </View>
          </View>
        </View>

        {Object.keys(groupedAchievements).map(category => (
          <View key={category} style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{category}</Text>

            {groupedAchievements[category].map(achievement => {
              const isUnlocked = achievements.unlocked?.includes(achievement.id);
              const progressPercentage = Math.min(
                Math.round((achievement.progress / achievement.threshold) * 100),
                100
              );

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    { backgroundColor: theme.isDark ? theme.card : '#F8F9FA' },
                    isUnlocked && [styles.unlockedAchievementCard, { backgroundColor: theme.primaryLight }]
                  ]}
                >
                  <View style={styles.achievementHeader}>
                    <View
                      style={[
                        styles.achievementIcon,
                        { backgroundColor: isUnlocked ? achievement.color : theme.isDark ? '#555555' : '#CCCCCC' }
                      ]}
                    >
                      <Ionicons
                        name={achievement.icon}
                        size={24}
                        color="#FFFFFF"
                      />
                    </View>

                    <View style={styles.achievementInfo}>
                      <Text
                        style={[
                          styles.achievementTitle,
                          { color: theme.text },
                          isUnlocked && { color: theme.primary }
                        ]}
                      >
                        {achievement.title}
                      </Text>
                      <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                        {achievement.description}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.progressBarContainer, { backgroundColor: theme.isDark ? '#444444' : '#EEEEEE' }]}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%`, backgroundColor: theme.isDark ? '#666666' : '#CCCCCC' },
                        isUnlocked && { backgroundColor: achievement.color }
                      ]}
                    />
                  </View>

                  <Text style={[styles.progressStatus, { color: theme.textSecondary }]}>
                    {isUnlocked
                      ? 'Completed!'
                      : `${achievement.progress} / ${achievement.threshold}`}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
            All achievement data is stored locally on your device.
          </Text>
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
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressContainer: {
    alignItems: 'center',
    marginRight: 24,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  statsDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  statItem: {
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
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
    marginBottom: 16,
  },
  achievementCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  unlockedAchievementCard: {
    backgroundColor: '#F0EEFF',
  },
  achievementHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unlockedAchievementTitle: {
    color: '#6C63FF',
  },
  achievementDescription: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressStatus: {
    fontSize: 12,
    textAlign: 'right',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default AchievementsScreen;