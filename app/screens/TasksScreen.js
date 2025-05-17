import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { isFuture, isPast, isToday, parseISO } from 'date-fns';
import { useContext, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskItem from '../../components/TaskItem';
import { AppContext } from '../context';

const TasksScreen = () => {
  const navigation = useNavigation();
  const { tasks, updateTask } = useContext(AppContext);
  const [filter, setFilter] = useState('all');

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (task.archived && filter !== 'archived') return false;

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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8F9FA" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTask')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'today' && styles.activeFilter]}
            onPress={() => setFilter('today')}
          >
            <Text style={[styles.filterText, filter === 'today' && styles.activeFilterText]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.activeFilter]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'overdue' && styles.activeFilter]}
            onPress={() => setFilter('overdue')}
          >
            <Text style={[styles.filterText, filter === 'overdue' && styles.activeFilterText]}>
              Overdue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'ongoing' && styles.activeFilter]}
            onPress={() => setFilter('ongoing')}
          >
            <Text style={[styles.filterText, filter === 'ongoing' && styles.activeFilterText]}>
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'thisWeek' && styles.activeFilter]}
            onPress={() => setFilter('thisWeek')}
          >
            <Text style={[styles.filterText, filter === 'thisWeek' && styles.activeFilterText]}>
              This Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'priority' && styles.activeFilter]}
            onPress={() => setFilter('priority')}
          >
            <Text style={[styles.filterText, filter === 'priority' && styles.activeFilterText]}>
              High Priority
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'archived' && styles.activeFilter]}
            onPress={() => setFilter('archived')}
          >
            <Text style={[styles.filterText, filter === 'archived' && styles.activeFilterText]}>
              Archived
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {sections.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.subject}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{item.subject}</Text>
              {item.data.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                  updateTask={updateTask}
                />
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list" size={64} color="#DDD" />
          <Text style={styles.emptyStateTitle}>No tasks found</Text>
          <Text style={styles.emptyStateText}>
            {filter === 'all'
              ? "You don't have any tasks yet"
              : `You don't have any ${filter} tasks`}
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
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
    backgroundColor: '#F8F9FA',
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
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#EEEEEE',
  },
  activeFilter: {
    backgroundColor: '#6C63FF',
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
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
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    backgroundColor: '#6C63FF',
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
