import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { isFuture, isPast, isToday, parseISO } from 'date-fns';
import { useContext, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskItem from '../components/TaskItem';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const TasksScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { tasks, updateTask, settings } = useContext(AppContext);
  const [filter, setFilter] = useState('all');

  // Get enabled filters from settings
  const enabledFilters = settings.enabledFilters || {
    today: true,
    upcoming: true,
    overdue: true,
    ongoing: true,
    thisWeek: true,
    priority: true,
    completed: true,
    archived: false
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (task.archived && filter !== 'archived') return false;
    if (!task.dueDate) return filter === 'all' || filter === 'archived' && task.archived;

    const dueDate = parseISO(task.dueDate);
    const now = new Date();

    switch (filter) {
      case 'today':
        return isToday(dueDate) && !task.completed;
      case 'upcoming':
        return isFuture(dueDate) && !isToday(dueDate) && !task.completed;
      case 'overdue':
        return isPast(dueDate) && !isToday(dueDate) && !task.completed;
      case 'completed':
        return task.completed && !task.archived;
      case 'ongoing':
        return !task.completed && task.progress && task.progress > 0 && task.progress < 100;
      case 'priority':
        return !task.completed && task.priority === 'high';
      case 'thisWeek': {
        const weekEnd = new Date();
        weekEnd.setDate(now.getDate() + (7 - now.getDay()));
        return !task.completed && dueDate <= weekEnd && dueDate >= now;
      }
      case 'archived':
        return task.archived;
      case 'all':
        return !task.archived; // Show all non-archived tasks
      default:
        return !task.completed && !task.archived;
    }
  });

  // Group tasks by subject
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const subject = task.subject || 'Other';

    if (!acc[subject]) {
      acc[subject] = [];
    }

    acc[subject].push(task);
    return acc;
  }, {});

  // Convert to array format for FlatList
  const sections = Object.keys(groupedTasks).map(subject => ({
    subject,
    data: groupedTasks[subject]
  }));

  // Sort sections alphabetically
  sections.sort((a, b) => a.subject.localeCompare(b.subject));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBar} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.filterSettingsButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => navigation.navigate('Settings', { section: 'taskFilters' })}
          >
            <Ionicons name="options-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Filter Tasks</Text>

        <View style={styles.filterGrid}>
          <TouchableOpacity
            style={[
              styles.filterCard,
              { backgroundColor: filter === 'all' ? theme.primary : theme.primaryLight }
            ]}
            onPress={() => setFilter('all')}
          >
            <Ionicons name="list" size={22} color={filter === 'all' ? '#FFFFFF' : theme.primary} />
            <Text style={[
              styles.filterCardText,
              { color: filter === 'all' ? '#FFFFFF' : theme.primary }
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {enabledFilters.today && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'today' ? theme.primary : theme.primaryLight }
              ]}
              onPress={() => setFilter('today')}
            >
              <Ionicons name="today" size={22} color={filter === 'today' ? '#FFFFFF' : theme.primary} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'today' ? '#FFFFFF' : theme.primary }
              ]}>
                Today
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.upcoming && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'upcoming' ? theme.primary : theme.primaryLight }
              ]}
              onPress={() => setFilter('upcoming')}
            >
              <Ionicons name="calendar" size={22} color={filter === 'upcoming' ? '#FFFFFF' : theme.primary} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'upcoming' ? '#FFFFFF' : theme.primary }
              ]}>
                Upcoming
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.overdue && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'overdue' ? theme.danger : `${theme.danger}20` }
              ]}
              onPress={() => setFilter('overdue')}
            >
              <Ionicons name="alert-circle" size={22} color={filter === 'overdue' ? '#FFFFFF' : theme.danger} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'overdue' ? '#FFFFFF' : theme.danger }
              ]}>
                Overdue
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterGrid}>
          {enabledFilters.ongoing && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'ongoing' ? theme.primary : theme.primaryLight }
              ]}
              onPress={() => setFilter('ongoing')}
            >
              <Ionicons name="hourglass" size={22} color={filter === 'ongoing' ? '#FFFFFF' : theme.primary} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'ongoing' ? '#FFFFFF' : theme.primary }
              ]}>
                In Progress
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.thisWeek && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'thisWeek' ? theme.primary : theme.primaryLight }
              ]}
              onPress={() => setFilter('thisWeek')}
            >
              <Ionicons name="calendar-outline" size={22} color={filter === 'thisWeek' ? '#FFFFFF' : theme.primary} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'thisWeek' ? '#FFFFFF' : theme.primary }
              ]}>
                This Week
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.priority && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'priority' ? theme.danger : `${theme.danger}20` }
              ]}
              onPress={() => setFilter('priority')}
            >
              <Ionicons name="flag" size={22} color={filter === 'priority' ? '#FFFFFF' : theme.danger} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'priority' ? '#FFFFFF' : theme.danger }
              ]}>
                High Priority
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.completed && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'completed' ? theme.success : `${theme.success}20` }
              ]}
              onPress={() => setFilter('completed')}
            >
              <Ionicons name="checkmark-circle" size={22} color={filter === 'completed' ? '#FFFFFF' : theme.success} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'completed' ? '#FFFFFF' : theme.success }
              ]}>
                Completed
              </Text>
            </TouchableOpacity>
          )}

          {enabledFilters.archived && (
            <TouchableOpacity
              style={[
                styles.filterCard,
                { backgroundColor: filter === 'archived' ? theme.textSecondary : `${theme.textSecondary}20` }
              ]}
              onPress={() => setFilter('archived')}
            >
              <Ionicons name="archive" size={22} color={filter === 'archived' ? '#FFFFFF' : theme.textSecondary} />
              <Text style={[
                styles.filterCardText,
                { color: filter === 'archived' ? '#FFFFFF' : theme.textSecondary }
              ]}>
                Archived
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {sections.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.subject}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{item.subject}</Text>
              {item.data.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                  updateTask={updateTask}
                  theme={theme}
                />
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list" size={64} color={theme.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No tasks found</Text>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            {filter === 'all'
              ? "You don't have any tasks yet"
              : `You don't have any ${filter} tasks`}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Text style={styles.emptyStateButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterCard: {
    width: '23%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterCardText: {
    fontWeight: '500',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TasksScreen;