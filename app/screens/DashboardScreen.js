import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import ProgressRing from '../../components/ProgressRing';
import StreakCalendar from '../../components/StreakCalendar';
import { AppContext } from '../context';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const {
    tasks,
    streaks,
    settings,
    stats
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
    const dueDate = new Date(task.dueDate);
    return (
      format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
      !task.completed &&
      !task.archived
    );
  });

  // Get upcoming exams (in the next 7 days)
  const upcomingExams = useContext(AppContext).exams.filter(exam => {
    const examDate = new Date(exam.date);
    const diffDays = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7 && !exam.completed;
  }).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />

      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{format(today, 'EEEE, MMMM d')}</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FFFFFF" />
            <Text style={styles.streakText}>{streaks.current}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.goalContainer}>
            <ProgressRing
              progress={dailyStudyProgress}
              size={120}
              strokeWidth={12}
              progressColor="#6C63FF"
            />
            <Text style={styles.goalLabel}>Daily Goal</Text>
            <Text style={styles.goalText}>
              {streaks.studyDays?.[format(today, 'yyyy-MM-dd')] || 0} / {settings.dailyGoalMinutes} min
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalStudyTime}</Text>
              <Text style={styles.statLabel}>Total Minutes</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streaks.longest}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
          </View>
        </View>

        {/* Weekly Goal Progress */}
        <View style={styles.weeklyGoalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Goals</Text>
          </View>

          <View style={styles.goalCards}>
            {/* Weekly Study Time Goal */}
            <View style={styles.goalCard}>
              <View style={styles.goalCardHeader}>
                <Ionicons name="time-outline" size={20} color="#6C63FF" />
                <Text style={styles.goalCardTitle}>Study Time</Text>
              </View>

              <View style={styles.goalProgress}>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min(100, ((stats.goalProgress?.weeklyStudyTime || 0) / (settings.dailyGoalMinutes * 7)) * 100)}%`,
                        backgroundColor: '#6C63FF'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.goalProgressText}>
                  {stats.goalProgress?.weeklyStudyTime || 0} / {settings.dailyGoalMinutes * 7} min
                </Text>
              </View>
            </View>

            {/* Weekly Tasks Completed Goal */}
            <View style={styles.goalCard}>
              <View style={styles.goalCardHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.goalCardTitle}>Tasks Completed</Text>
              </View>

              <View style={styles.goalProgress}>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min(100, ((stats.goalProgress?.weeklyTasksCompleted || 0) / (settings.weeklyTaskGoal || 10)) * 100)}%`,
                        backgroundColor: '#4CAF50'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.goalProgressText}>
                  {stats.goalProgress?.weeklyTasksCompleted || 0} / {settings.weeklyTaskGoal || 10} tasks
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Text style={styles.sectionActionText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskList}>
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => navigation.navigate('Tasks', { screen: 'TaskDetail', params: { taskId: task.id } })}
                >
                  <View style={styles.taskCheckbox}>
                    <Ionicons name="ellipse-outline" size={20} color="#6C63FF" />
                  </View>
                  <Text
                    style={styles.taskTitle}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.priority && (
                    <View
                      style={[
                        styles.priorityIndicator,
                        task.priority === 'high' && { backgroundColor: '#F44336' },
                        task.priority === 'medium' && { backgroundColor: '#FF9800' },
                        task.priority === 'low' && { backgroundColor: '#4CAF50' },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No tasks for today</Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('Tasks', { screen: 'AddTask' })}
                >
                  <Text style={styles.emptyStateButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Exams</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => navigation.navigate('More', { screen: 'Exams' })}
            >
              <Text style={styles.sectionActionText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.examList}>
            {upcomingExams.length > 0 ? (
              upcomingExams.map(exam => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examItem}
                  onPress={() => navigation.navigate('More', {
                    screen: 'Exams',
                    params: { examId: exam.id }
                  })}
                >
                  <View style={styles.examContent}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <View style={styles.examDetails}>
                      <View style={styles.examDetail}>
                        <Ionicons name="calendar-outline" size={14} color="#666" />
                        <Text style={styles.examDetailText}>
                          {format(new Date(exam.date), 'MMM d, yyyy')}
                        </Text>
                      </View>
                      {exam.subject && (
                        <View style={styles.examTag}>
                          <Text style={styles.examTagText}>{exam.subject}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.examDaysLeft}>
                    <Text style={styles.examDaysNumber}>
                      {Math.floor((new Date(exam.date) - today) / (1000 * 60 * 60 * 24)) + 1}
                    </Text>
                    <Text style={styles.examDaysText}>days left</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No upcoming exams</Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('More', { screen: 'Exams' })}
                >
                  <Text style={styles.emptyStateButtonText}>Add Exam</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Calendar</Text>
          <StreakCalendar studyDays={streaks.studyDays} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Timer')}
            >
              <Ionicons name="timer-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Start Focus Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Tasks', { screen: 'AddTask' })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Add New Task</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Exams')}
            >
              <Ionicons name="calendar-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Manage Exams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Resources')}
            >
              <Ionicons name="book-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Study Resources</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Ionicons name="bar-chart-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Achievements</Text>
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
    backgroundColor: '#F8F9FA',
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
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  streakBadge: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#333',
    marginTop: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  weeklyGoalsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  goalCards: {
    marginTop: 8,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
  },
  goalProgress: {
    marginTop: 4,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#EEEEEE',
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
    color: '#666',
    textAlign: 'right',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#6C63FF',
  },
  examList: {
    marginTop: 8,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  examContent: {
    flex: 1,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
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
    color: '#666',
    marginLeft: 4,
  },
  examTag: {
    backgroundColor: '#F0EEFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examTagText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  examDaysLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  examDaysNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  examDaysText: {
    fontSize: 10,
    color: '#666',
  },
  emptyStateContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  emptyStateButton: {
    backgroundColor: '#6C63FF',
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
    backgroundColor: '#F0EEFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    margin: 4,
  },
  quickActionText: {
    marginTop: 8,
    color: '#6C63FF',
    fontWeight: '500',
  },
});

export default DashboardScreen;
