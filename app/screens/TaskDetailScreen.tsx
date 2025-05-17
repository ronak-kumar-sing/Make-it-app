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
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const TaskDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
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
      return { text: 'Completed', color: theme.success };
    } else if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Overdue', color: theme.danger };
    } else if (isToday(dueDate)) {
      return { text: 'Due today', color: theme.warning };
    } else {
      return { text: 'Upcoming', color: theme.primary };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.danger;
      case 'medium':
        return theme.warning;
      case 'low':
        return theme.success;
      default:
        return theme.primary;
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBar} />

      <View style={[
        styles.header,
        { backgroundColor: task.completed ? `${theme.success}20` : theme.primaryLight },
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: isEditing ? theme.primary : 'transparent' }]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name={isEditing ? "checkmark" : "create-outline"}
              size={24}
              color={isEditing ? "#FFFFFF" : theme.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteTask}
          >
            <Ionicons name="trash-outline" size={24} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: theme.background }]}>
        {!isEditing ? (
          <>
            <View style={styles.titleContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: theme.primary },
                  task.completed && { backgroundColor: theme.primary }
                ]}>
                  {task.completed && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <Text style={[
                styles.title,
                { color: theme.text },
                task.completed && { color: theme.textSecondary, textDecorationLine: 'line-through' }
              ]}>
                {task.title}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Due Date</Text>
              </View>

              <View style={styles.sectionContent}>
                <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(task.dueDate)}</Text>
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
                  <Ionicons name="bookmark-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Subject</Text>
                </View>

                <View style={styles.sectionContent}>
                  <View style={[styles.subjectBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.subjectText, { color: theme.primary }]}>{task.subject}</Text>
                  </View>
                </View>
              </View>
            )}

            {task.priority && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flag-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Priority</Text>
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
                  <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Description</Text>
                </View>

                <Text style={[styles.descriptionText, { color: theme.text }]}>{task.description}</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Created</Text>
              </View>

              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {format(parseISO(task.createdAt), 'MMMM d, yyyy')}
              </Text>

              {task.completed && task.completedAt && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                    <Text style={[styles.sectionTitle, { color: theme.success }]}>Completed</Text>
                  </View>

                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {format(parseISO(task.completedAt), 'MMMM d, yyyy')}
                  </Text>
                </>
              )}
            </View>

            {/* Task History Section */}
            {task.history && task.history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="git-branch-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Task History</Text>
                </View>

                <View style={styles.historyContainer}>
                  {task.history.slice().reverse().map((entry, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={[styles.historyDot, { backgroundColor: theme.primary }]} />
                      <View style={[styles.historyContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                          {format(parseISO(entry.timestamp), 'MMM d, yyyy - h:mm a')}
                        </Text>
                        <Text style={[styles.historyChanges, { color: theme.text }]}>
                          {entry.changes.split(',').join(', ')}
                        </Text>
                        {typeof entry.progress === 'number' && (
                          <View style={[styles.miniProgressContainer, { backgroundColor: theme.border }]}>
                            <View style={[styles.miniProgress, { width: `${entry.progress}%`, backgroundColor: theme.primary }]} />
                            <Text style={[styles.miniProgressText, { color: theme.textSecondary }]}>{entry.progress}% complete</Text>
                          </View>
                        )}
                        {entry.completed !== undefined && (
                          <Text style={[
                            styles.historyStatus,
                            { color: entry.completed ? theme.success : theme.warning }
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
              <Text style={[styles.label, { color: theme.text }]}>Task Title</Text>
              <TextInput
                style={[styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={editedTask.title}
                onChangeText={text => setEditedTask(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={editedTask.description}
                onChangeText={text => setEditedTask(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
              <TextInput
                style={[styles.input,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={editedTask.subject}
                onChangeText={text => setEditedTask(prev => ({ ...prev, subject: text }))}
                placeholder="Enter subject"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
              <View style={styles.priorityContainer}>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { backgroundColor: theme.card },
                    editedTask.priority === 'low' && { backgroundColor: theme.success }
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'low' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    { color: theme.text },
                    editedTask.priority === 'low' && styles.selectedPriorityText
                  ]}>
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { backgroundColor: theme.card },
                    editedTask.priority === 'medium' && { backgroundColor: theme.warning }
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'medium' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    { color: theme.text },
                    editedTask.priority === 'medium' && styles.selectedPriorityText
                  ]}>
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    { backgroundColor: theme.card },
                    editedTask.priority === 'high' && { backgroundColor: theme.danger }
                  ]}
                  onPress={() => setEditedTask(prev => ({ ...prev, priority: 'high' }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    { color: theme.text },
                    editedTask.priority === 'high' && styles.selectedPriorityText
                  ]}>
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Due Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.primaryLight }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                <Text style={[styles.dateButtonText, { color: theme.primary }]}>
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
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.primary }]}
              onPress={() => {
                setEditedTask({ ...task });
                setIsEditing(false);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Cancel</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
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
    marginLeft: 8,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
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
  },
  subjectText: {
    fontSize: 14,
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
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
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
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
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
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
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
    marginRight: 12,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyChanges: {
    fontSize: 14,
    marginBottom: 8,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  miniProgressContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  miniProgress: {
    height: '100%',
    borderRadius: 3,
  },
  miniProgressText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
});

export default TaskDetailScreen;