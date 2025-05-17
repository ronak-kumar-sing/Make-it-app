import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { differenceInDays, format, isPast } from 'date-fns';
import { useContext, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const ExamsScreen = () => {
  const { theme } = useTheme();
  const { exams, subjects, addExam, updateExam, deleteExam } = useContext(AppContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    subject: '',
    date: new Date(),
    time: '09:00',
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
    return dateA - dateB;
  });

  // Group exams by upcoming/past
  const upcomingExams = sortedExams.filter(exam => !isPast(new Date(exam.date)));
  const pastExams = sortedExams.filter(exam => isPast(new Date(exam.date)));

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || newExam.date;
    setShowDatePicker(false);
    setNewExam({ ...newExam, date: currentDate });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Calculate days until exam
  const getDaysUntil = (dateString) => {
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

  // Save new exam
  const saveExam = () => {
    if (!newExam.title) {
      Alert.alert('Please enter a title for the exam.');
      return;
    }

    if (newExam.id) {
      updateExam(newExam.id, newExam);
    } else {
      addExam(newExam);
    }

    setModalVisible(false);
    setNewExam({
      title: '',
      description: '',
      subject: '',
      date: new Date(),
      time: '09:00',
      location: '',
      completed: false,
    });
  };

  // Delete an exam
  const confirmDeleteExam = (id) => {
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
          onPress: () => deleteExam(id),
        },
      ]
    );
  };

  // Toggle exam completion
  const toggleExamCompletion = (id) => {
    const exam = exams.find(e => e.id === id);
    if (exam) {
      updateExam(id, { completed: !exam.completed });
    }
  };

  // Render an exam item
  const renderExamItem = ({ item }) => {
    const subjectColor = subjects.find(s => s.name === item.subject)?.color || '#607D8B';
    const daysUntil = getDaysUntil(item.date);
    const isPastExam = isPast(new Date(item.date));

    return (
      <TouchableOpacity
        style={[
          styles.examItem,
          { backgroundColor: theme.card },
          item.completed && { backgroundColor: theme.isDark ? theme.card : '#F8F9FA' }
        ]}
        onPress={() => {
          setNewExam(item);
          setModalVisible(true);
        }}
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

          {item.time && (
            <View style={styles.examDetail}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>{item.time}</Text>
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
            onPress={() => {
              setNewExam(item);
              setModalVisible(true);
            }}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Exams & Assignments</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setNewExam({
              title: '',
              description: '',
              subject: '',
              date: new Date(),
              time: '09:00',
              location: '',
              completed: false,
            });
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {exams && exams.length > 0 ? (
        <FlatList
          data={[
            { title: 'Upcoming', data: upcomingExams },
            { title: 'Past', data: pastExams }
          ]}
          keyExtractor={(item) => item.title}
          renderItem={({ item: section }) => (
            section.data.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                {section.data.map(exam => (
                  <View key={exam.id}>
                    {renderExamItem({ item: exam })}
                  </View>
                ))}
              </View>
            ) : null
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar" size={64} color={theme.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No exams or assignments</Text>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Add your upcoming exams and assignments to keep track of them
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setNewExam({
                title: '',
                description: '',
                subject: '',
                date: new Date(),
                time: '09:00',
                location: '',
                completed: false,
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.emptyStateButtonText}>Add Exam</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Exam Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {newExam.id ? 'Edit Exam' : 'Add Exam'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newExam.title}
                  onChangeText={(text) => setNewExam({ ...newExam, title: text })}
                  placeholder="Enter exam title"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }
                  ]}
                  value={newExam.description}
                  onChangeText={(text) => setNewExam({ ...newExam, description: text })}
                  placeholder="Enter exam description"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
                <View style={styles.subjectContainer}>
                  {subjects.map(subject => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectTag,
                        {
                          backgroundColor: newExam.subject === subject.name ?
                            `${subject.color}20` :
                            theme.isDark ? theme.card : '#F8F9FA'
                        }
                      ]}
                      onPress={() => setNewExam({ ...newExam, subject: subject.name })}
                    >
                      <Text
                        style={[
                          styles.subjectText,
                          { color: newExam.subject === subject.name ? subject.color : theme.textSecondary }
                        ]}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: theme.primaryLight }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                  <Text style={[styles.dateText, { color: theme.primary }]}>
                    {format(newExam.date, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={newExam.date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Time</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newExam.time}
                  onChangeText={(text) => setNewExam({ ...newExam, time: text })}
                  placeholder="Enter exam time (e.g. 09:00)"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Location</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newExam.location}
                  onChangeText={(text) => setNewExam({ ...newExam, location: text })}
                  placeholder="Enter exam location"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: newExam.completed ? theme.primary : 'transparent',
                        borderColor: theme.primary
                      }
                    ]}
                    onPress={() => setNewExam({ ...newExam, completed: !newExam.completed })}
                  >
                    {newExam.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>Mark as completed</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={saveExam}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  examItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 12,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  examDetails: {
    marginBottom: 8,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  examActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  examAction: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
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
    height: 80,
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExamsScreen;