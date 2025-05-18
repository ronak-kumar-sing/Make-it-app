import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format, isPast } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  createdAt?: string;
}

const ExamsScreen = () => {
  const { theme } = useTheme();
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
  const [newExam, setNewExam] = useState<Partial<Exam> & { date: Date }>({
    title: '',
    description: '',
    subject: '',
    date: new Date(),
    time: '09:00',
    location: '',
    completed: false,
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getDaysUntil = (dateString: string) => {
    const days = differenceInDays(new Date(dateString), new Date());
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  // Function to toggle exam completion status
  const toggleExamCompletion = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      updateExam(examId, { ...exam, completed: !exam.completed });
    }
  };

  // Function to confirm and delete an exam
  const confirmDeleteExam = (examId: string) => {
    Alert.alert(
      "Delete Exam",
      "Are you sure you want to delete this exam?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExam(examId) }
      ]
    );
  };

  // Function to handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewExam(prev => ({ ...prev, date: selectedDate }));
    }
  };

  // Function to handle saving an exam
  const handleSaveExam = () => {
    if (!newExam.title) {
      Alert.alert('Required Field', 'Please enter a title for the exam.');
      return;
    }

    const examData = {
      ...newExam,
      date: format(newExam.date, 'yyyy-MM-dd'),
    };

    if (newExam.id) {
      updateExam(newExam.id, examData as Exam);
    } else {
      addExam(examData as Exam);

      // Schedule notification if enabled
      if (notificationsEnabled) {
        NotificationService.scheduleExamReminder(examData as Exam);
      }
    }

    // Reset form and close modal
    setNewExam({
      title: '',
      description: '',
      subject: '',
      date: new Date(),
      time: '09:00',
      location: '',
      completed: false,
    });
    setModalVisible(false);
  };

  // Function to render each exam item
  const renderExamItem = ({ item }: { item: Exam }) => {
    const subjectColor = subjects.find(s => s.name === item.subject)?.color || '#607D8B';
    const daysUntil = getDaysUntil(item.date);
    const isPastExam = isPast(new Date(item.date));

    return (
      <TouchableOpacity
        style={[
          styles.examItem,
          { backgroundColor: theme.card }
        ]}
        onPress={() => {
          setNewExam({
            ...item,
            date: new Date(item.date)
          });
          setModalVisible(true);
        }}
      >
        <View style={styles.examHeader}>
          <View style={styles.examTitleContainer}>
            <Text style={[styles.examTitle, { color: theme.text }]}>
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
        </View>
        <View style={styles.examDetails}>
          <View style={styles.examDetail}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          {item.time && (
            <View style={styles.examDetail}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>
                {item.time}
              </Text>
            </View>
          )}
          {item.location && (
            <View style={styles.examDetail}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.examDetailText, { color: theme.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.examActions}>
          <TouchableOpacity
            style={styles.examAction}
            onPress={() => {
              setNewExam({
                ...item,
                date: new Date(item.date)
              });
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

  // Render the screen content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Exams</Text>
      </View>

      {exams.length > 0 ? (
        <FlatList
          data={exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          renderItem={renderExamItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No exams scheduled. Add your first exam to get started!
          </Text>
        </View>
      )}

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
        <Text style={styles.addButtonText}>Add Exam</Text>
      </TouchableOpacity>

      {/* Exam Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {newExam.id ? 'Edit Exam' : 'Add New Exam'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Form fields would go here */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveExam}
              >
                <Text style={styles.saveButtonText}>Save Exam</Text>
              </TouchableOpacity>
            </ScrollView>
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
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  examItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  examTitleContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  examDetails: {
    marginBottom: 12,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examDetailText: {
    marginLeft: 6,
    fontSize: 14,
  },
  examActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  examAction: {
    marginLeft: 16,
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ExamsScreen;
