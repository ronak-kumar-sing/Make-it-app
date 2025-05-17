import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TaskItem = ({ task, onPress }) => {
  const { title, subject, dueDate, completed, priority, progress, archived } = task;

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
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              completed && styles.completedTitle,
              archived && styles.archivedTitle
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {archived && (
            <View style={styles.statusTag}>
              <Text style={styles.statusTagText}>Archived</Text>
            </View>
          )}
        </View>

        {progress > 0 && progress < 100 && !completed && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%` }
              ]}
            />
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  archivedTitle: {
    color: '#999',
    fontStyle: 'italic',
  },
  statusTag: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusTagText: {
    fontSize: 10,
    color: '#666',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6C63FF',
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
