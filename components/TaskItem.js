import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, parseISO } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskStatusButton from './TaskStatusButton';

const TaskItem = ({ task, onPress, updateTask }) => {
  const { title, subject, dueDate, completed, priority } = task;

  // Format the due date
  const formatDueDate = (dateString) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return 'Today';
    }

    return format(date, 'MMM d');
  };

  // Check if overdue
  const isOverdue = !completed && isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate));

  // Get priority color
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#6C63FF';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          completed && styles.checkboxChecked
        ]}>
          {completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            completed && styles.completedTitle
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.metaContainer}>
          {subject && (
            <Text style={styles.subject}>{subject}</Text>
          )}

          {dueDate && (
            <View style={styles.dateContainer}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? '#F44336' : '#666'}
              />
              <Text
                style={[
                  styles.date,
                  isOverdue && styles.overdueDate
                ]}
              >
                {formatDueDate(dueDate)}
              </Text>
            </View>
          )}

          {/* Display TaskStatusButton if updateTask function is provided */}
          {updateTask && (
            <TaskStatusButton task={task} updateTask={updateTask} />
          )}
        </View>
      </View>

      {priority && (
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor() }
          ]}
        />
      )}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    flexWrap: 'wrap',
    gap: 6,
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
