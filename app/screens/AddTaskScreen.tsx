import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useContext, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const AddTaskScreen = () => {
  const navigation = useNavigation();
  const { addTask, subjects } = useContext(AppContext);
  const { theme, isDark } = useTheme(); // Get isDark separately to avoid theme.isDark issues

  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Subject options
  const subjectOptions = [
    'Math',
    'Science',
    'History',
    'English',
    'Computer Science',
    'Foreign Language',
    'Other'
  ];

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);
  };

  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setDueTime(`${formattedHours}:${formattedMinutes}`);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return 'No time set';

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  };

  // Handle task creation
  const handleCreateTask = () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const newTask = {
      title,
      description,
      subject,
      priority,
      dueDate: dueDate.toISOString(),
      dueTime: dueTime || undefined, // Include due time if set
    };

    addTask(newTask);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.card }]}>
      <ScrollView>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Task Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
          <View style={styles.subjectContainer}>
            {subjectOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.subjectTag,
                  { backgroundColor: isDark ? theme.backgroundAlt : '#E1F5FE' },
                  subject === item && [styles.selectedSubject, { backgroundColor: '#01579B' }]
                ]}
                onPress={() => setSubject(item)}
              >
                <Text
                  style={[
                    styles.subjectText,
                    { color: isDark ? theme.primary : '#01579B' },
                    subject === item && styles.selectedSubjectText
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
          <View style={styles.priorityContainer}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                { backgroundColor: isDark ? theme.backgroundAlt : '#F5F5F5' },
                priority === 'low' && styles.selectedPriorityLow
              ]}
              onPress={() => setPriority('low')}
            >
              <Ionicons
                name="arrow-down"
                size={20}
                color={priority === 'low' ? '#FFFFFF' : '#4CAF50'}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: priority === 'low' ? '#FFFFFF' : '#4CAF50' }
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                { backgroundColor: isDark ? theme.backgroundAlt : '#F5F5F5' },
                priority === 'medium' && styles.selectedPriorityMedium
              ]}
              onPress={() => setPriority('medium')}
            >
              <Ionicons
                name="remove"
                size={20}
                color={priority === 'medium' ? '#FFFFFF' : '#FF9800'}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: priority === 'medium' ? '#FFFFFF' : '#FF9800' }
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                { backgroundColor: isDark ? theme.backgroundAlt : '#F5F5F5' },
                priority === 'high' && styles.selectedPriorityHigh
              ]}
              onPress={() => setPriority('high')}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={priority === 'high' ? '#FFFFFF' : '#F44336'}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: priority === 'high' ? '#FFFFFF' : '#F44336' }
                ]}
              >
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
            <Text style={[styles.dateText, { color: theme.primary }]}>{formatDate(dueDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Due Time (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.primary }]}>
              {dueTime ? formatTime(dueTime) : 'Set time'}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={dueTime ? (() => {
                const [hours, minutes] = dueTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date;
              })() : new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Note: Completed tasks that are past their due date will be automatically archived
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Due Time (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.primary }]}>{dueTime ? formatTime(dueTime) : 'Set time'}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={dueTime ? (() => {
                const [hours, minutes] = dueTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date;
              })() : new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateTask}
        >
          <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Create Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectTag: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  selectedSubject: {
    backgroundColor: '#01579B',
  },
  subjectText: {
    fontSize: 14,
  },
  selectedSubjectText: {
    color: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
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
  priorityText: {
    marginLeft: 8,
    fontSize: 14,
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
  dateText: {
    marginLeft: 8,
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  createButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddTaskScreen;