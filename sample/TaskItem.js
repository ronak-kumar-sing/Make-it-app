import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const TaskItem = ({ task, onPress }) => {
  const { toggleTaskCompletion } = useContext(AppContext);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#FF9800';
    }
  };
  
  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        task.completed && styles.completedContainer
      ]}
      onPress={onPress}
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleTaskCompletion(task.id)}
      >
        <View
          style={[
            styles.checkbox,
            task.completed && styles.checkboxChecked
          ]}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            task.completed && styles.completedTitle
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        <View style={styles.metaContainer}>
          {task.subject && (
            <Text style={styles.subject}>{task.subject}</Text>
          )}
          
          {task.dueDate && (
            <View style={styles.dateContainer}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue() ? '#F44336' : '#666'}
              />
              <Text
                style={[
                  styles.date,
                  isOverdue() && styles.overdueDate
                ]}
              >
                {formatDate(task.dueDate)}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: getPriorityColor(task.priority) }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  completedContainer: {
    backgroundColor: '#F8F9FA',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subject: {
    fontSize: 12,
    color: '#6C63FF',
    backgroundColor: '#F0EEFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  overdueDate: {
    color: '#F44336',
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginLeft: 8,
  },
});

export default TaskItem;