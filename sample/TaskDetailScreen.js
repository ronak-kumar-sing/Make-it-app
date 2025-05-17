import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const TaskDetailScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const { tasks, toggleTaskCompletion, deleteTask } = useContext(AppContext);
  
  const [task, setTask] = useState(null);
  
  // Find task by ID
  useEffect(() => {
    const foundTask = tasks.find(t => t.id === taskId);
    if (foundTask) {
      setTask(foundTask);
    } else {
      Alert.alert('Error', 'Task not found');
      navigation.goBack();
    }
  }, [taskId, tasks]);
  
  // Handle task not found
  if (!task) {
    return null;
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
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
  
  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Medium Priority';
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            navigation.goBack();
          },
        },
      ]
    );
  };
  
  // Handle task completion toggle
  const handleToggleCompletion = () => {
    toggleTaskCompletion(task.id);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                // In a real app, navigate to edit screen
                Alert.alert('Edit', 'Edit functionality would go here');
              }}
            >
              <Ionicons name="create-outline" size={24} color="#6C63FF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteTask}
            >
              <Ionicons name="trash-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleToggleCompletion}
            >
              <View
                style={[
                  styles.checkbox,
                  task.completed && styles.checkboxChecked
                ]}
              >
                {task.completed && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
            
            <Text
              style={[
                styles.title,
                task.completed && styles.completedTitle
              ]}
            >
              {task.title}
            </Text>
          </View>
          
          <View style={styles.metaContainer}>
            {task.subject && (
              <View style={styles.subjectTag}>
                <Text style={styles.subjectText}>{task.subject}</Text>
              </View>
            )}
            
            <View
              style={[
                styles.priorityTag,
                { backgroundColor: getPriorityColor(task.priority) }
              ]}
            >
              <Ionicons name="flag" size={14} color="#FFFFFF" />
              <Text style={styles.priorityText}>
                {getPriorityLabel(task.priority)}
              </Text>
            </View>
          </View>
          
          {task.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Due Date</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color="#6C63FF" />
              <Text style={styles.dateText}>{formatDate(task.dueDate)}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View
              style={[
                styles.statusTag,
                {
                  backgroundColor: task.completed
                    ? '#E8F5E9'
                    : '#FFF3E0'
                }
              ]}
            >
              <Ionicons
                name={task.completed ? 'checkmark-circle' : 'time'}
                size={20}
                color={task.completed ? '#4CAF50' : '#FF9800'}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: task.completed
                      ? '#4CAF50'
                      : '#FF9800'
                  }
                ]}
              >
                {task.completed ? 'Completed' : 'Pending'}
              </Text>
            </View>
            
            {task.completed && task.completedAt && (
              <Text style={styles.completedDate}>
                Completed on {formatDate(task.completedAt)}
              </Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created</Text>
            <Text style={styles.createdDate}>
              {formatDate(task.createdAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              task.completed ? styles.resetButton : styles.completeButton
            ]}
            onPress={handleToggleCompletion}
          >
            <Ionicons
              name={task.completed ? 'refresh' : 'checkmark-circle'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  subjectTag: {
    backgroundColor: '#F0EEFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  subjectText: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  statusText: {
    fontWeight: '500',
    marginLeft: 4,
  },
  completedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  createdDate: {
    fontSize: 16,
    color: '#333',
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 16,
  },
  completeButton: {
    backgroundColor: '#6C63FF',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TaskDetailScreen;