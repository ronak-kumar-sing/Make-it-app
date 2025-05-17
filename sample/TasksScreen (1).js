import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import TaskItem from '../components/TaskItem';

const TasksScreen = ({ navigation }) => {
  const { tasks } = useContext(AppContext);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'upcoming', 'completed'
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    
    if (filter === 'completed') return task.completed;
    
    if (!task.dueDate) return filter === 'no-date';
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (filter === 'today') {
      return dueDate.getTime() === today.getTime() && !task.completed;
    }
    
    if (filter === 'upcoming') {
      return dueDate.getTime() > today.getTime() && !task.completed;
    }
    
    if (filter === 'overdue') {
      return dueDate.getTime() < today.getTime() && !task.completed;
    }
    
    return true;
  });
  
  // Group tasks by subject
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const subject = task.subject || 'Other';
    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject].push(task);
    return groups;
  }, {});
  
  // Convert grouped tasks to array for FlatList
  const sections = Object.keys(groupedTasks).map(subject => ({
    subject,
    data: groupedTasks[subject]
  }));
  
  // Sort sections by subject name
  sections.sort((a, b) => a.subject.localeCompare(b.subject));
  
  return (
    <SafeAreaView style={styles.container}>
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
            style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
              Completed
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
            <Text style={styles.emptyStateButtonText}>Add New Task</Text>
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
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TasksScreen;