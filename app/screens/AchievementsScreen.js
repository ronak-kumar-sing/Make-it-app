import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context';

const AchievementsScreen = () => {
  const { achievements, stats, streaks } = useContext(AppContext);

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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.progressContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{achievementPercentage}%</Text>
            </View>
            <Text style={styles.progressLabel}>Completed</Text>
          </View>

          <View style={styles.statsDetails}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unlockedAchievements}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalAchievements - unlockedAchievements}</Text>
              <Text style={styles.statLabel}>Locked</Text>
            </View>
          </View>
        </View>

        {Object.keys(groupedAchievements).map(category => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>

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
                    isUnlocked && styles.unlockedAchievementCard
                  ]}
                >
                  <View style={styles.achievementHeader}>
                    <View
                      style={[
                        styles.achievementIcon,
                        { backgroundColor: isUnlocked ? achievement.color : '#CCCCCC' }
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
                          isUnlocked && styles.unlockedAchievementTitle
                        ]}
                      >
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%` },
                        isUnlocked && { backgroundColor: achievement.color }
                      ]}
                    />
                  </View>

                  <Text style={styles.progressStatus}>
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
          <Ionicons name="lock-closed-outline" size={16} color="#666" />
          <Text style={styles.privacyText}>
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
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
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
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
  achievementCard: {
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#CCCCCC',
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
    color: '#333',
    marginBottom: 4,
  },
  unlockedAchievementTitle: {
    color: '#6C63FF',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#CCCCCC',
    borderRadius: 4,
  },
  progressStatus: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    marginLeft: 8,
  },
});

export default AchievementsScreen;
