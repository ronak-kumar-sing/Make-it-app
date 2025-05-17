import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context';

const TaskDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId } = route.params;
  const { tasks, toggleTaskCompletion, updateTask, deleteTask } = useContext(AppContext);

  // Find the task
  const task = tasks.find(t => t.id === taskId);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Set edited task when task changes
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  // Handle navigation if task doesn't exist
  useEffect(() => {
    if (!task) {
      Alert.alert('Error', 'Task not found');
      navigation.goBack();
    }
  }, [task, navigation]);

  if (!task) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Get due date status
  const getDueDateStatus = () => {
    const dueDate = parseISO(task.dueDate);

    if (task.completed) {
      return { text: 'Completed', color: '#4CAF50' };
    } else if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Overdue', color: '#F44336' };
    } else if (isToday(dueDate)) {
      return { text: 'Due today', color: '#FF9800' };
    } else {
      return { text: 'Upcoming', color: '#2196F3' };
    }
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
        return '#6C63FF';
    }
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || parseISO(editedTask.dueDate);
    setShowDatePicker(false);
    setEditedTask(prev => ({ ...prev, dueDate: currentDate.toISOString() }));
  };

  // Handle task update
  const handleSaveChanges = () => {
    if (!editedTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    updateTask(task.id, editedTask);
    setIsEditing(false);
  };

  // Handle task deletion
  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Get status text
  const status = getDueDateStatus();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={task.completed ? '#E8F5E9' : '#F0EEFF'} barStyle="dark-content" />

      <View style={[
        styles.header,
        task.completed && styles.completedHeader
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, isEditing && { backgroundColor: '#6C63FF' }]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name={isEditing ? "checkmark" : "create-outline"}
              size={24}
              color={isEditing ? "#FFFFFF" : "#6C63FF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteTask}
          >
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!isEditing ? (
          <>
            <View style={styles.titleContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={[
                  styles.checkbox,
                  task.completed && styles.checkboxChecked
                ]}>
                  {task.completed && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <Text style={[
                styles.title,
                task.completed && styles.completedText
              ]}>
                {task.title}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.sectionTitle}>Due Date</Text>
              </View>

              <View style={styles.sectionContent}>
                <Text style={styles.dateText}>{formatDate(task.dueDate)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.text}
                  </Text>
                </View>
              </View>
            </View>

            {task.subject && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bookmark-outline" size={20} color="#666" />
                  <Text style={styles.sectionTitle}>Subject</Text>
                </View>

                <View style={styles.sectionContent}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{task.subject}</Text>
                  </View>
                </View>
              </View>
            )}

            {task.priority && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flag-outline" size={20} color="#666" />
                  <Text style={styles.sectionTitle}>Priority</Text>
                </View>

                <View style={styles.sectionContent}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(task.priority)}20` }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(task.priority) }
                    ]}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {task.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color="#666" />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>

                <Text style={styles.descriptionText}>{task.description}</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.sectionTitle}>Created</Text>
              </View>

              <Text style={styles.metaText}>
                {format(parseISO(task.createdAt), 'MMMM d, yyyy')}
              </Text>

              {task.completed && task.completedAt && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                    <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>Completed</Text>
                  </View>

                  <Text style={styles.metaText}>
                    {format(parseISO(task.completedAt), 'MMMM d, yyyy')}
                  </Text>
                </>
              )}
            </View>

            {/* Task History Section */}
            {task.history && task.history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="git-branch-outline" size={20} color="#666" />
                  <Text style={styles.sectionTitle}>Task History</Text>
                </View>

                <View style={styles.historyContainer}>
                  {task.history.slice().reverse().map((entry, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyDot} />
                      <View style={styles.historyContent}>
                        <Text style={styles.historyDate}>
                          {format(parseISO(entry.timestamp), 'MMM d, yyyy - h:mm a')}
                        </Text>
                        <Text style={styles.historyChanges}>
                          {entry.changes.split(',').join(', ')}
                        </Text>
                        {typeof entry.progress === 'number' && (
                          <View style={styles.miniProgressContainer}>
                            <View style={[styles.miniProgress, { width: `${entry.progress}%` }]} />
                            <Text style={styles.miniProgressText}>{entry.progress}% complete</Text>
                          </View>
                        )}
                        {entry.completed !== undefined && (
                          <Text style={[
                            styles.historyStatus,
                            { color: entry.completed ? '#4CAF50' : '#FF9800' }
                          ]}>
                            {entry.completed ? 'Marked as completed' : 'Marked as incomplete'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          // Edit Mode
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Title</Text>
              <TextInput
                style={styles.input}
                value={editedTask.title}
                onChangeText={text => setEditedTask(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedTask.description}
                onChangeText={text => setEditedTask(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={editedTask.subject}
                onChangeText={text => setEditedTask(prev => ({ ...prev, subject: text }))}
                placeholder="Enter subject"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    editedTask.priority === 'low' && styles.selectedPriorityLow
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'low' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    editedTask.priority === 'low' && styles.selectedPriorityText
                  ]}>
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    editedTask.priority === 'medium' && styles.selectedPriorityMedium
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'medium' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    editedTask.priority === 'medium' && styles.selectedPriorityText
                  ]}>
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    editedTask.priority === 'high' && styles.selectedPriorityHigh
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'high' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    editedTask.priority === 'high' && styles.selectedPriorityText
                  ]}>
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
                <Text style={styles.dateButtonText}>
                  {formatDate(editedTask.dueDate)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={parseISO(editedTask.dueDate)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditedTask({ ...task });
                setIsEditing(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: '#F0EEFF',
  },
  completedHeader: {
    backgroundColor: '#E8F5E9',
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
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 8,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
  },
  subjectText: {
    fontSize: 14,
    color: '#6C63FF',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedPriorityLow: {
    backgroundColor: '#4CAF50',
  },
  selectedPriorityMedium: {
    backgroundColor: '#FF9800',
  },
  selectedPriorityHigh: {
    backgroundColor: '#F44336',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#6C63FF',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
    marginRight: 12,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historyChanges: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  miniProgressContainer: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  miniProgress: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 3,
  },
  miniProgressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },
});

export default TaskDetailScreen;
