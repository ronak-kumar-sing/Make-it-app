import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { useContext } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressRing from '../components/ProgressRing';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Define the navigation param list for type safety
type RootStackParamList = {
  Tasks: { screen?: string; params?: any };
  Timer: undefined;
  Exams: { params?: { examId: string } };
  Resources: undefined;
  Analytics: undefined;
  Achievements: undefined;
};

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const {
    tasks,
    streaks,
    settings,
    stats,
    exams
  } = useContext(AppContext);

  // Get today's date
  const today = new Date();

  // Calculate daily study goal progress
  const dailyStudyProgress = Math.min(
    (streaks.studyDays?.[format(today, 'yyyy-MM-dd')] || 0) / settings.dailyGoalMinutes,
    1
  );

  // Filter tasks for today
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return (
      format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
      !task.completed &&
      !task.archived
    );
  });

  // Get upcoming exams (in the next 7 days)
  const upcomingExams = exams.filter(exam => {
    const examDate = new Date(exam.date);
    const diffDays = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7 && !exam.completed;
  }).slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBar} />

      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>{format(today, 'EEEE, MMMM d')}</Text>
            <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: theme.primary }]}>
            <Ionicons name="flame" size={16} color="#FFFFFF" />
            <Text style={styles.streakText}>{streaks.current}</Text>
          </View>
        </View>

        <View style={[styles.progressSection, { backgroundColor: theme.card }]}>
          <View style={styles.goalContainer}>
            <ProgressRing
              progress={dailyStudyProgress}
              size={120}
              strokeWidth={12}
              progressColor={theme.primary}
              backgroundColor={`${theme.primary}20`}
            />
            <Text style={[styles.goalLabel, { color: theme.text }]}>Daily Goal</Text>
            <Text style={[styles.goalText, { color: theme.textSecondary }]}>
              {((streaks.studyDays?.[format(today, 'yyyy-MM-dd')] || 0) / 60).toFixed(1)} / {(settings.dailyGoalMinutes / 60).toFixed(1)} hrs
            </Text>
          </View>

          <View style={[styles.statsContainer, { borderTopColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{(stats.totalStudyTime / 60).toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Study Hours</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.sessionsCompleted || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sessions</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.dailySessionCount?.[format(today, 'yyyy-MM-dd')] || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today's Sessions</Text>
            </View>
          </View>
        </View>

        {/* Weekly Goal Progress */}
        <View style={styles.weeklyGoalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Goals</Text>
          </View>

          <View style={styles.goalCards}>
            {/* Weekly Study Time Goal */}
            <View style={[styles.goalCard, { backgroundColor: theme.card }]}>
              <View style={styles.goalCardHeader}>
                <Ionicons name="time-outline" size={20} color={theme.primary} />
                <Text style={[styles.goalCardTitle, { color: theme.text }]}>Study Time</Text>
              </View>

              <View style={styles.goalProgress}>
                <View style={[styles.goalProgressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min(100, ((stats.goalProgress?.weeklyStudyTime || 0) / (settings.dailyGoalMinutes * 7)) * 100)}%`,
                        backgroundColor: theme.primary
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.goalProgressText, { color: theme.textSecondary }]}>
                  {((stats.goalProgress?.weeklyStudyTime || 0) / 60).toFixed(1)} / {((settings.dailyGoalMinutes * 7) / 60).toFixed(1)} hrs
                </Text>
              </View>
            </View>

            {/* Weekly Tasks Completed Goal */}
            <View style={[styles.goalCard, { backgroundColor: theme.card }]}>
              <View style={styles.goalCardHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.goalCardTitle, { color: theme.text }]}>Tasks Completed</Text>
              </View>

              <View style={styles.goalProgress}>
                <View style={[styles.goalProgressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min(100, ((stats.goalProgress?.weeklyTasksCompleted || 0) / (settings.weeklyTaskGoal || 10)) * 100)}%`,
                        backgroundColor: theme.success
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.goalProgressText, { color: theme.textSecondary }]}>
                  {stats.goalProgress?.weeklyTasksCompleted || 0} / {settings.weeklyTaskGoal || 10} tasks
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Tasks</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Text style={[styles.sectionActionText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskList}>
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { backgroundColor: theme.background }]}
                  onPress={() => navigation.navigate('Tasks', { screen: 'TaskDetail', params: { taskId: task.id } })}
                >
                  <View style={styles.taskCheckbox}>
                    <Ionicons name="ellipse-outline" size={20} color={theme.primary} />
                  </View>
                  <Text
                    style={[styles.taskTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.priority && (
                    <View
                      style={[
                        styles.priorityIndicator,
                        task.priority === 'high' && { backgroundColor: theme.danger },
                        task.priority === 'medium' && { backgroundColor: theme.warning },
                        task.priority === 'low' && { backgroundColor: theme.success },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No tasks for today</Text>
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('Tasks', { screen: 'AddTask' })}
                >
                  <Text style={styles.emptyStateButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Exams</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => navigation.navigate('Exams')}
            >
              <Text style={[styles.sectionActionText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.examList}>
            {upcomingExams.length > 0 ? (
              upcomingExams.map(exam => (
                <TouchableOpacity
                  key={exam.id}
                  style={[styles.examItem, { backgroundColor: theme.background }]}
                  onPress={() => navigation.navigate('Exams', {
                    params: { examId: exam.id }
                  })}
                >
                  <View style={styles.examContent}>
                    <Text style={[styles.examTitle, { color: theme.text }]}>{exam.title}</Text>
                    <View style={styles.examDetails}>
                      <View style={styles.examDetail}>
                        <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>
                          {format(new Date(exam.date), 'MMM d, yyyy')}
                        </Text>
                      </View>
                      {exam.subject && (
                        <View style={[styles.examTag, { backgroundColor: theme.primaryLight }]}>
                          <Text style={[styles.examTagText, { color: theme.primary }]}>{exam.subject}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.examDaysLeft}>
                    <Text style={[styles.examDaysNumber, { color: theme.primary }]}>
                      {Math.floor((new Date(exam.date) - today) / (1000 * 60 * 60 * 24)) + 1}
                    </Text>
                    <Text style={[styles.examDaysText, { color: theme.textSecondary }]}>days left</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No upcoming exams</Text>
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('Exams')}
                >
                  <Text style={styles.emptyStateButtonText}>Add Exam</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Timer')}
            >
              <Ionicons name="timer-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Start Focus Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Tasks', { screen: 'AddTask' })}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Add New Task</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Exams')}
            >
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Manage Exams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Resources')}
            >
              <Ionicons name="book-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Study Resources</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Ionicons name="bar-chart-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Achievements</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 8,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  streakText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  goalText: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  weeklyGoalsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  goalCards: {
    marginTop: 8,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  goalProgress: {
    marginTop: 4,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 14,
    textAlign: 'right',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    fontWeight: '500',
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  examList: {
    marginTop: 8,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  examContent: {
    flex: 1,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  examDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  examDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  examTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examTagText: {
    fontSize: 12,
  },
  examDaysLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  examDaysNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  examDaysText: {
    fontSize: 10,
  },
  emptyStateContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    marginBottom: 12,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  quickAction: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    margin: 4,
  },
  quickActionText: {
    marginTop: 8,
    fontWeight: '500',
  },
});

export default DashboardScreen;