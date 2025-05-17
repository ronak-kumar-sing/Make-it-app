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
import { AppContext } from '../context';

const AddTaskScreen = () => {
  const navigation = useNavigation();
  const { addTask, subjects } = useContext(AppContext);

  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
    };

    addTask(newTask);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Subject</Text>
          <View style={styles.subjectContainer}>
            {subjectOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.subjectTag,
                  subject === item && styles.selectedSubject
                ]}
                onPress={() => setSubject(item)}
              >
                <Text
                  style={[
                    styles.subjectText,
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
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
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
                  priority === 'low' && styles.selectedPriorityText
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
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
                  priority === 'medium' && styles.selectedPriorityText
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
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
                  priority === 'high' && styles.selectedPriorityText
                ]}
              >
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
            <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
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

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTask}
        >
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
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
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectTag: {
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  selectedSubject: {
    backgroundColor: '#6C63FF',
  },
  subjectText: {
    color: '#6C63FF',
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
    backgroundColor: '#F8F9FA',
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
    color: '#666',
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
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6C63FF',
  },
  createButton: {
    backgroundColor: '#6C63FF',
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
