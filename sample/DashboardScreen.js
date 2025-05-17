import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import ProgressRing from '../components/ProgressRing';
import TaskItem from '../components/TaskItem';
import StreakCalendar from '../components/StreakCalendar';

const DashboardScreen = ({ navigation }) => {
  const { tasks, streaks, stats, settings } = useContext(AppContext);
  
  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  // Filter tasks due today
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear() &&
      !task.completed
    );
  });
  
  // Calculate daily progress
  const dailyProgress = Math.min(
    (stats.totalStudyTime / settings.dailyGoalMinutes) * 100,
    100
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.greeting}>
            {today.getHours() < 12
              ? 'Good Morning'
              : today.getHours() < 18
              ? 'Good Afternoon'
              : 'Good Evening'}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ProgressRing 
              progress={dailyProgress} 
              size={80} 
              strokeWidth={8} 
              color="#6C63FF"
            />
            <Text style={styles.statTitle}>Daily Goal</Text>
            <Text style={styles.statValue}>
              {stats.totalStudyTime}/{settings.dailyGoalMinutes} min
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={32} color="#FF6B6B" />
              <Text style={styles.streakCount}>{streaks.current}</Text>
            </View>
            <Text style={styles.statTitle}>Current Streak</Text>
            <Text style={styles.statValue}>
              {streaks.current === 1 ? '1 day' : `${streaks.current} days`}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.taskBadge}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={styles.taskCount}>{stats.tasksCompleted}</Text>
            </View>
            <Text style={styles.statTitle}>Completed</Text>
            <Text style={styles.statValue}>
              {stats.tasksCompleted === 1 ? '1 task' : `${stats.tasksCompleted} tasks`}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {todayTasks.length > 0 ? (
            todayTasks.slice(0, 3).map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks due today</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddTask')}
              >
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Streak</Text>
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
              onPress={() => navigation.navigate('AddTask')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6C63FF" />
              <Text style={styles.quickActionText}>Add New Task</Text>
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
    padding: 20,
    backgroundColor: '#6C63FF',
  },
  date: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  streakBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  taskBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCount: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  seeAll: {
    color: '#6C63FF',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#999',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionText: {
    marginLeft: 8,
    color: '#6C63FF',
    fontWeight: '500',
  },
});

export default DashboardScreen;