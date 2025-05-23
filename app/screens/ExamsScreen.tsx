import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { differenceInDays, format, isPast } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import * as NotificationService from '../services/NotificationService';

// Define types
interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  completed: boolean;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
}

const ExamsScreen = () => {
  const { theme, isDark } = useTheme();
  const { exams, subjects, addExam, updateExam, deleteExam, settings } = useContext(AppContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check if notifications are enabled
  useEffect(() => {
    const checkNotificationStatus = async () => {
      const { status } = await NotificationService.checkPermissions();
      setNotificationsEnabled(status === 'granted' && settings.notifications);
    };

    checkNotificationStatus();
  }, [settings.notifications]);

  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [newExam, setNewExam] = useState<Partial<Exam> & { date: Date, startTimeDate?: Date, endTimeDate?: Date }>({
    title: '',
    description: '',
    subject: '',
    date: new Date(),
    time: '09:00',
    startTimeDate: new Date(),
    endTimeDate: new Date(new Date().getTime() + 60 * 60 * 1000), // Default end time 1 hour after start
    startTime: format(new Date(), 'HH:mm'),
    endTime: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
    location: '',
    completed: false,
  });

  // Sort exams by date (upcoming first, then past)
  const sortedExams = [...exams].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // If one is past and one is upcoming, upcoming comes first
    if (isPast(dateA) && !isPast(dateB)) return 1;
    if (!isPast(dateA) && isPast(dateB)) return -1;

    // Otherwise sort by date
    return dateA.getTime() - dateB.getTime();
  });

  // Group exams by upcoming/past
  const upcomingExams = sortedExams.filter(exam => !isPast(new Date(exam.date)));
  const pastExams = sortedExams.filter(exam => isPast(new Date(exam.date)));

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || newExam.date;
    setShowDatePicker(false);
    setNewExam({ ...newExam, date: currentDate });
  };

  // Handle start time change
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || newExam.startTimeDate;
    setShowStartTimePicker(false);
    setNewExam({
      ...newExam,
      startTimeDate: currentTime,
      startTime: format(currentTime, 'HH:mm')
    });
  };

  // Handle end time change
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || newExam.endTimeDate;
    setShowEndTimePicker(false);
    setNewExam({
      ...newExam,
      endTimeDate: currentTime,
      endTime: format(currentTime, 'HH:mm')
    });
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Calculate days until exam
  const getDaysUntil = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = differenceInDays(date, today);

    if (days < 0) {
      return 'Past';
    } else if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Tomorrow';
    } else {
      return `${days} days`;
    }
  };

  // Save new exam with notification
  const saveExam = async () => {
    if (!newExam.title) {
      Alert.alert('Please enter a title for the exam.');
      return;
    }

    // Convert Date object to string for storage
    const examToSave = {
      ...newExam,
      date: format(newExam.date, 'yyyy-MM-dd')
    };

    try {
      // Save the exam
      if (newExam.id) {
        // Update existing exam
        updateExam(newExam.id, examToSave);

        // Handle notification for updated exam if notifications are enabled
        if (notificationsEnabled && !newExam.completed && newExam.id) {
          // First cancel any existing notifications for this exam
          await NotificationService.cancelExamReminders(newExam.id);

          // Then schedule new notifications if the exam is in the future
          if (!isPast(newExam.date)) {
            await NotificationService.scheduleExamReminder({
              ...examToSave,
              id: newExam.id
            } as Exam);
          }
        } else if (newExam.completed && newExam.id) {
          // If exam is marked as completed, cancel any notifications
          await NotificationService.cancelExamReminders(newExam.id);
        }
      } else {
        // Create new exam - remove id since it should be generated by addExam
        const { id, startTimeDate, endTimeDate, ...newExamData } = examToSave;

        // Call addExam with required properties only
        const createdExam = addExam({
          title: newExamData.title,
          description: newExamData.description || '',
          subject: newExamData.subject || '',
          date: newExamData.date,
          time: newExamData.time || '',
          location: newExamData.location || '',
          startTime: newExamData.startTime || '',
          endTime: newExamData.endTime || '',
        });

        // Schedule notification for new exam if enabled and in the future
        if (notificationsEnabled && !isPast(newExam.date) && createdExam && typeof createdExam === 'object' && 'id' in createdExam) {
          await NotificationService.scheduleExamReminder(createdExam as Exam);
        }
      }

      // Reset form and close modal
      setModalVisible(false);
      setNewExam({
        title: '',
        description: '',
        subject: '',
        date: new Date(),
        time: '09:00',
        startTimeDate: new Date(),
        endTimeDate: new Date(new Date().getTime() + 60 * 60 * 1000),
        startTime: format(new Date(), 'HH:mm'),
        endTime: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm'),
        location: '',
        completed: false,
      });
    } catch (error) {
      console.error("Error saving exam:", error);
      Alert.alert("Error", "Failed to save exam. Please try again.");
    }
  };

  // Delete an exam and cancel its notifications
  const confirmDeleteExam = (id: string) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Cancel any notifications for this exam
            await NotificationService.cancelExamReminders(id);
            // Delete the exam
            deleteExam(id);
          },
        },
      ]
    );
  };

  // Toggle exam completion and handle notifications
  const toggleExamCompletion = async (id: string) => {
    const exam = exams.find(e => e.id === id);
    if (exam) {
      const updatedExam = { ...exam, completed: !exam.completed };
      updateExam(id, updatedExam);

      // If exam is marked as completed, cancel notifications
      if (!exam.completed) {
        await NotificationService.cancelExamReminders(id);
      } else {
        // If exam is marked as incomplete and is in the future, reschedule notification
        if (notificationsEnabled && !isPast(new Date(exam.date))) {
          await NotificationService.scheduleExamReminder({ ...exam, completed: false });
        }
      }
    }
  };

  // Request notification permissions if needed
  const ensureNotificationPermission = async () => {
    if (!notificationsEnabled && settings.notifications) {
      const { status } = await NotificationService.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      return status === 'granted';
    }
    return notificationsEnabled;
  };

  // Updated openAddExamModal function
  const openAddExamModal = async () => {
    // If notifications are enabled in settings but permission is not granted,
    // try to request permission when adding an exam
    if (settings.notifications && !notificationsEnabled) {
      await ensureNotificationPermission();
    }

    // Initialize with current time for start and one hour later for end
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

    setNewExam({
      title: '',
      description: '',
      subject: '',
      date: new Date(),
      time: '09:00',
      startTimeDate: startDate,
      endTimeDate: endDate,
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      location: '',
      completed: false,
    });

    setModalVisible(true);
  };

  // Set up edit exam with time pickers
  const editExam = (item: Exam) => {
    // Parse the times to create Date objects
    const startTimeDate = item.startTime ? parseTimeString(item.startTime) : new Date();
    const endTimeDate = item.endTime ? parseTimeString(item.endTime) : new Date(new Date().getTime() + 60 * 60 * 1000);

    setNewExam({
      ...item,
      date: new Date(item.date),
      startTimeDate,
      endTimeDate,
      startTime: item.startTime || format(startTimeDate, 'HH:mm'),
      endTime: item.endTime || format(endTimeDate, 'HH:mm'),
    });
    setModalVisible(true);
  };

  // Helper function to parse time string to Date object
  const parseTimeString = (timeStr: string): Date => {
    const date = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Render an exam item
  const renderExamItem = ({ item }: { item: Exam }) => {
    const subjectColor = subjects.find(s => s.name === item.subject)?.color || '#607D8B';
    const daysUntil = getDaysUntil(item.date);
    const isPastExam = isPast(new Date(item.date));

    return (
      <TouchableOpacity
        style={[
          styles.examItem,
          { backgroundColor: theme.card },
          item.completed && { backgroundColor: theme.card }
        ]}
        onPress={() => editExam(item)}
      >
        <View style={styles.examHeader}>
          <View style={styles.examTitleContainer}>
            <Text
              style={[
                styles.examTitle,
                { color: theme.text },
                item.completed && { color: theme.textSecondary, textDecorationLine: 'line-through' }
              ]}
            >
              {item.title}
            </Text>
            {item.subject && (
              <View style={[styles.subjectTag, { backgroundColor: `${subjectColor}20` }]}>
                <Text style={[styles.subjectText, { color: subjectColor }]}>
                  {item.subject}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.statusButton,
              item.completed ?
                { backgroundColor: `${theme.success}20` } :
                isPastExam ?
                  { backgroundColor: `${theme.danger}20` } :
                  { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => toggleExamCompletion(item.id)}
          >
            <Text style={[
              styles.statusButtonText,
              {
                color: item.completed ? theme.success :
                  isPastExam ? theme.danger :
                    theme.primary
              }
            ]}>
              {item.completed ? 'Completed' : isPastExam ? 'Past' : daysUntil}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.examDetails}>
          <View style={styles.examDetail}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
          </View>
          {(item.startTime || item.time) && (
            <View style={styles.examDetail}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>
                {item.startTime ? `${item.startTime} - ${item.endTime || '?'}` : item.time}
              </Text>
            </View>
          )}
          {item.location && (
            <View style={styles.examDetail}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>{item.location}</Text>
            </View>
          )}
        </View>
        <View style={styles.examActions}>
          <TouchableOpacity
            style={styles.examAction}
            onPress={() => editExam(item)}
          >
            <Ionicons name="create-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.examAction}
            onPress={() => confirmDeleteExam(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render the screen content
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openAddExamModal}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Exam</Text>
        </TouchableOpacity>

        {/* Exams List */}
        {exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No exams yet. Tap the button above to add one.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedExams}
            renderItem={renderExamItem}
            keyExtractor={(item: Exam) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Add/Edit Exam Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              height: '90%'  // Set a fixed height for the modal
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {newExam.id ? 'Edit Exam' : 'Add Exam'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Title Input */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                  borderWidth: 1
                }]}
                value={newExam.title}
                onChangeText={(text) => setNewExam({ ...newExam, title: text })}
                placeholder="Exam Title"
                placeholderTextColor={theme.textSecondary}
              />

              {/* Subject Dropdown */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject</Text>
              <View style={[styles.input, {
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderWidth: 1
              }]}>
                <Ionicons name="book-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={{ flex: 1, color: theme.text }}
                  value={newExam.subject}
                  onChangeText={(text) => setNewExam({ ...newExam, subject: text })}
                  placeholder="Select or enter subject"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Subject Quick Selection */}
              <View style={styles.subjectContainer}>
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectTag,
                      { backgroundColor: isDark ? `${subject.color}15` : `${subject.color}20` },
                      newExam.subject === subject.name && {
                        backgroundColor: isDark ? `${subject.color}30` : `${subject.color}40`,
                        borderWidth: 1,
                        borderColor: `${subject.color}50`
                      }
                    ]}
                    onPress={() => setNewExam({ ...newExam, subject: subject.name })}
                  >
                    <Text
                      style={[
                        styles.subjectText,
                        { color: subject.color },
                        newExam.subject === subject.name && { fontWeight: 'bold' }
                      ]}
                    >
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Picker */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Date *</Text>
              <TouchableOpacity
                style={[styles.input, {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderWidth: 1
                }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={{ color: theme.text }}>{format(newExam.date, 'EEEE, MMMM d, yyyy')}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newExam.date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              {/* Start Time Picker */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Start Time</Text>
              <TouchableOpacity
                style={[styles.input, {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderWidth: 1
                }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={{ color: theme.text }}>{newExam.startTime}</Text>
              </TouchableOpacity>

              {showStartTimePicker && (
                <DateTimePicker
                  value={newExam.startTimeDate || new Date()}
                  mode="time"
                  display="default"
                  onChange={onStartTimeChange}
                />
              )}

              {/* End Time Picker */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>End Time</Text>
              <TouchableOpacity
                style={[styles.input, {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderWidth: 1
                }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={{ color: theme.text }}>{newExam.endTime}</Text>
              </TouchableOpacity>

              {showEndTimePicker && (
                <DateTimePicker
                  value={newExam.endTimeDate || new Date()}
                  mode="time"
                  display="default"
                  onChange={onEndTimeChange}
                />
              )}

              {/* Legacy Time Input - keeping for backward compatibility */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Legacy Time Format (optional)</Text>
              <View style={[styles.input, {
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderWidth: 1
              }]}>
                <Ionicons name="hourglass-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={{ flex: 1, color: theme.text }}
                  value={newExam.time}
                  onChangeText={(text) => setNewExam({ ...newExam, time: text })}
                  placeholder="e.g. 09:00"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Location Input */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Location (optional)</Text>
              <View style={[styles.input, {
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderWidth: 1
              }]}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={{ flex: 1, color: theme.text }}
                  value={newExam.location}
                  onChangeText={(text) => setNewExam({ ...newExam, location: text })}
                  placeholder="e.g. Room 101"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Description Input */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description (optional)</Text>
              <TextInput
                style={[styles.textArea, {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                  borderWidth: 1
                }]}
                value={newExam.description}
                onChangeText={(text) => setNewExam({ ...newExam, description: text })}
                placeholder="Add notes about the exam"
                placeholderTextColor={theme.textSecondary}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Completed Checkbox */}
              {newExam.id && (
                <TouchableOpacity
                  style={styles.completedCheckbox}
                  onPress={() => setNewExam({ ...newExam, completed: !newExam.completed })}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: theme.primary },
                    newExam.completed && { backgroundColor: theme.primary }
                  ]}>
                    {newExam.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>Mark as completed</Text>
                </TouchableOpacity>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={saveExam}
              >
                <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                  {newExam.id ? 'Update Exam' : 'Add Exam'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  examItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  examDetails: {
    marginBottom: 12,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  examDetailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  examActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  examAction: {
    padding: 8,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Changed to show modal from bottom
    alignItems: 'center',
    padding: 0, // Removed padding
    margin: 0,
  },
  modalContent: {
    width: '100%', // Full width
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    padding: 16,
    flexGrow: 0,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  textArea: {
    height: 100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    marginBottom: 16,
  },
  completedCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  saveButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: -8,
  },
  subjectTag: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    margin: 4,
  },
});

export default ExamsScreen;
