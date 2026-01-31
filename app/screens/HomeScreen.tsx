// ============================================
// HomeScreen - Main Dashboard for StudyBuddy
// Optimized for student productivity
// ============================================

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, parseISO } from 'date-fns';
import React, { useContext, useMemo } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const context = useContext(AppContext);

  // Safely access context properties
  const tasks = context?.tasks || [];
  const streaks = context?.streaks || { current: 0, longest: 0 };
  const stats = context?.stats || { totalStudyTime: 0, todayStudyTime: 0, weeklyStudyTime: 0, tasksCompleted: 0 };
  const settings = context?.settings || { dailyGoalMinutes: 120 };

  const today = new Date();
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Calculate today's tasks
  const todaysTasks = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return tasks.filter((task: any) => {
      if (task.completed || task.archived) return false;
      if (!task.dueDate) return false;
      const taskDate = task.dueDate.split('T')[0];
      return taskDate === todayStr;
    });
  }, [tasks, today]);

  // Calculate daily progress
  const dailyProgress = useMemo(() => {
    if (settings.dailyGoalMinutes === 0) return 0;
    const todayStudyTime = stats.todayStudyTime || 0;
    return Math.min((todayStudyTime / settings.dailyGoalMinutes) * 100, 100);
  }, [stats.todayStudyTime, settings.dailyGoalMinutes]);

  // Calculate completed tasks today
  const completedToday = useMemo(() => {
    return tasks.filter((task: any) => {
      if (!task.completedAt) return false;
      try {
        return isToday(parseISO(task.completedAt));
      } catch {
        return false;
      }
    }).length;
  }, [tasks]);

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks
      .filter((task: any) => {
        if (task.completed || task.archived) return false;
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= weekFromNow;
      })
      .slice(0, 5);
  }, [tasks]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const quickActions = [
    {
      icon: 'timer-outline',
      label: 'Study Timer',
      color: '#6366F1',
      onPress: () => navigation.navigate('Timer'),
    },
    {
      icon: 'add-circle-outline',
      label: 'Add Task',
      color: '#10B981',
      onPress: () => navigation.navigate('AddTask'),
    },
    {
      icon: 'list-outline',
      label: 'Tasks',
      color: '#F59E0B',
      onPress: () => navigation.navigate('Tasks'),
    },
    {
      icon: 'bar-chart-outline',
      label: 'Analytics',
      color: '#EC4899',
      onPress: () => navigation.navigate('Analytics'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBar} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {format(today, 'EEEE, MMMM d')}
            </Text>
            <Text style={[styles.greetingText, { color: theme.text }]}>
              {greeting} 👋
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: theme.primary || '#6366F1' }]}
            onPress={() => navigation.navigate('Streaks')}
          >
            <Ionicons name="flame" size={18} color="#FFF" />
            <Text style={styles.streakText}>{streaks.current || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Study Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Daily Study Goal
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {formatTime(stats.todayStudyTime || 0)} / {formatTime(settings.dailyGoalMinutes)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContent}>
            <View style={styles.progressRingContainer}>
              <View style={[styles.progressRingBg, { borderColor: `${theme.primary || '#6366F1'}20` }]} />
              <Text style={[styles.progressText, { color: theme.text }]}>
                {Math.round(dailyProgress)}%
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={[styles.statValue, { color: theme.text }]}>{completedToday}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#F59E0B" />
                <Text style={[styles.statValue, { color: theme.text }]}>{todaysTasks.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={24} color="#EF4444" />
                <Text style={[styles.statValue, { color: theme.text }]}>{streaks.current || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, { backgroundColor: theme.card }]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.seeAllText, { color: theme.primary || '#6366F1' }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {todaysTasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-done-outline" size={32} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No tasks for today! 🎉
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: theme.primary || '#6366F1' }]}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Text style={[styles.addButtonText, { color: theme.primary || '#6366F1' }]}>
                Add a Task
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {todaysTasks.slice(0, 3).map((task: any) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              >
                <View
                  style={[
                    styles.taskPriority,
                    {
                      backgroundColor:
                        task.priority === 'high'
                          ? '#EF4444'
                          : task.priority === 'medium'
                          ? '#F59E0B'
                          : '#10B981',
                    },
                  ]}
                />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  {task.subject && (
                    <Text style={[styles.taskSubject, { color: theme.textSecondary }]}>
                      {task.subject}
                    </Text>
                  )}
                </View>
                <View style={styles.taskMeta}>
                  {task.dueTime && (
                    <Text style={[styles.taskTime, { color: theme.primary || '#6366F1' }]}>
                      {task.dueTime}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Weekly Stats */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>This Week</Text>
        <View style={[styles.weeklyCard, { backgroundColor: theme.card }]}>
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Ionicons name="time-outline" size={28} color={theme.primary || '#6366F1'} />
              <Text style={[styles.weeklyStatValue, { color: theme.text }]}>
                {formatTime(stats.weeklyStudyTime || 0)}
              </Text>
              <Text style={[styles.weeklyStatLabel, { color: theme.textSecondary }]}>
                Study Time
              </Text>
            </View>
            <View style={styles.weeklyStatDivider} />
            <View style={styles.weeklyStat}>
              <Ionicons name="checkmark-done-outline" size={28} color="#10B981" />
              <Text style={[styles.weeklyStatValue, { color: theme.text }]}>
                {stats.tasksCompleted || 0}
              </Text>
              <Text style={[styles.weeklyStatLabel, { color: theme.textSecondary }]}>
                Tasks Done
              </Text>
            </View>
            <View style={styles.weeklyStatDivider} />
            <View style={styles.weeklyStat}>
              <Ionicons name="trophy-outline" size={28} color="#F59E0B" />
              <Text style={[styles.weeklyStatValue, { color: theme.text }]}>
                {streaks.longest || 0}
              </Text>
              <Text style={[styles.weeklyStatLabel, { color: theme.textSecondary }]}>
                Best Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Coming Up</Text>
            </View>
            <View style={styles.upcomingList}>
              {upcomingTasks.map((task: any) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.upcomingCard, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                >
                  <View style={styles.upcomingDate}>
                    <Text style={[styles.upcomingDay, { color: theme.primary || '#6366F1' }]}>
                      {format(new Date(task.dueDate), 'd')}
                    </Text>
                    <Text style={[styles.upcomingMonth, { color: theme.textSecondary }]}>
                      {format(new Date(task.dueDate), 'MMM')}
                    </Text>
                  </View>
                  <View style={styles.upcomingContent}>
                    <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {task.subject && (
                      <Text style={[styles.taskSubject, { color: theme.textSecondary }]}>
                        {task.subject}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLeft: {},
  dateText: {
    fontSize: 14,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  progressContent: {
    alignItems: 'center',
  },
  progressRingContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressRingBg: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
  },
  progressText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tasksList: {
    marginBottom: 24,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskPriority: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskSubject: {
    fontSize: 12,
    marginTop: 4,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  weeklyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  weeklyStatLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  weeklyStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  upcomingList: {
    marginBottom: 24,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  upcomingDate: {
    width: 48,
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingDay: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  upcomingMonth: {
    fontSize: 12,
  },
  upcomingContent: {
    flex: 1,
  },
});

export default HomeScreen;
