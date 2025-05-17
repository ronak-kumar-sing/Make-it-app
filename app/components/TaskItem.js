import { Ionicons } from '@expo/vector-icons';
import { addDays, format, isPast, isToday, parseISO } from 'date-fns';
import { useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const TaskItem = ({ task, onPress, updateTask }) => {
  const { theme } = useTheme();
  const { title, subject, dueDate, completed, priority, progress, archived } = task;
  const [menuVisible, setMenuVisible] = useState(false);

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
        return theme.danger || '#F44336';
      case 'medium':
        return theme.warning || '#FF9800';
      case 'low':
        return theme.success || '#4CAF50';
      default:
        return theme.primary;
    }
  };

  // Toggle task completion
  const toggleCompletion = () => {
    const updatedTask = {
      ...task,
      completed: !completed,
      completedAt: !completed ? new Date().toISOString() : null
    };
    updateTask(task.id, updatedTask);
  };

  // Open context menu
  const openMenu = () => {
    setMenuVisible(true);
  };

  // Close context menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Handle task status changes
  const handleStatusChange = (newStatus) => {
    let updatedTask = { ...task };
    const today = new Date();

    switch (newStatus) {
      case 'today':
        updatedTask.dueDate = today.toISOString();
        updatedTask.completed = false;
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        updatedTask.dueDate = tomorrow.toISOString();
        updatedTask.completed = false;
        break;
      case 'thisWeek':
        const endOfWeek = addDays(today, 7 - today.getDay());
        updatedTask.dueDate = endOfWeek.toISOString();
        updatedTask.completed = false;
        break;
      case 'inProgress':
        updatedTask.progress = updatedTask.progress ? updatedTask.progress : 25;
        updatedTask.completed = false;
        break;
      case 'highPriority':
        updatedTask.priority = 'high';
        break;
      case 'completed':
        updatedTask.completed = true;
        updatedTask.completedAt = new Date().toISOString();
        break;
      case 'uncompleted':
        updatedTask.completed = false;
        updatedTask.completedAt = null;
        break;
      default:
        break;
    }

    updateTask(task.id, updatedTask);
    closeMenu();
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor: theme.card },
          task.aiGenerated && styles.aiResourceItem
        ]}
        onPress={onPress}
        onLongPress={openMenu}
        delayLongPress={500}
      >
        <View style={styles.checkboxContainer}>
          <TouchableOpacity onPress={toggleCompletion}>
            <View style={[
              styles.checkbox,
              { borderColor: theme.primary },
              completed && [styles.checkboxChecked, { backgroundColor: theme.primary }]
            ]}>
              {completed && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: theme.text },
                completed && [styles.completedTitle, { color: theme.textSecondary }],
                archived && [styles.archivedTitle, { color: theme.textSecondary }]
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {archived && (
              <View style={[styles.statusTag, { backgroundColor: theme.isDark ? theme.card : '#E0E0E0' }]}>
                <Text style={[styles.statusTagText, { color: theme.textSecondary }]}>Archived</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={openMenu}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {progress > 0 && progress < 100 && !completed && (
            <View style={[styles.progressBarContainer, { backgroundColor: theme.isDark ? theme.card : '#EEEEEE' }]}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress}%`, backgroundColor: theme.primary }
                ]}
              />
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}

          <View style={styles.metaContainer}>
            {subject && (
              <Text style={[styles.subject, {
                color: theme.primary,
                backgroundColor: theme.primaryLight
              }]}>{subject}</Text>
            )}

            {dueDate && (
              <View style={styles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={isOverdue ? (theme.danger || '#F44336') : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.date,
                    { color: theme.textSecondary },
                    isOverdue && { color: theme.danger || '#F44336' }
                  ]}
                >
                  {formatDueDate(dueDate)}
                </Text>
              </View>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Task Status</Text>

            <View style={styles.modalItems}>
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => handleStatusChange('today')}
              >
                <Ionicons name="today" size={24} color={theme.primary} />
                <Text style={[styles.modalItemText, { color: theme.text }]}>Move to Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => handleStatusChange('tomorrow')}
              >
                <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                <Text style={[styles.modalItemText, { color: theme.text }]}>Move to Tomorrow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => handleStatusChange('thisWeek')}
              >
                <Ionicons name="calendar" size={24} color={theme.primary} />
                <Text style={[styles.modalItemText, { color: theme.text }]}>Move to This Week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => handleStatusChange('inProgress')}
              >
                <Ionicons name="hourglass" size={24} color={theme.warning || '#FF9800'} />
                <Text style={[styles.modalItemText, { color: theme.text }]}>Mark as In Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => handleStatusChange('highPriority')}
              >
                <Ionicons name="flag" size={24} color={theme.danger || '#F44336'} />
                <Text style={[styles.modalItemText, { color: theme.text }]}>Set High Priority</Text>
              </TouchableOpacity>

              {!completed ? (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleStatusChange('completed')}
                >
                  <Ionicons name="checkmark-circle" size={24} color={theme.success || '#4CAF50'} />
                  <Text style={[styles.modalItemText, { color: theme.text }]}>Mark as Completed</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleStatusChange('uncompleted')}
                >
                  <Ionicons name="close-circle" size={24} color={theme.danger || '#F44336'} />
                  <Text style={[styles.modalItemText, { color: theme.text }]}>Mark as Incomplete</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={closeMenu}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  archivedTitle: {
    fontStyle: 'italic',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusTagText: {
    fontSize: 10,
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    position: 'absolute',
    right: 4,
    fontSize: 8,
    color: '#FFFFFF',
    alignSelf: 'center',
    textAlign: 'right',
    textAlignVertical: 'center',
    top: -0.5,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subject: {
    fontSize: 12,
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
  quickActionButton: {
    padding: 5,
    marginLeft: 5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItems: {
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  closeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskItem;