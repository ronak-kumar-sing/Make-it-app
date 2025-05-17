import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TaskStatusButton = ({ task, updateTask }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Set the task to Today
  const setToToday = () => {
    updateTask(task.id, {
      dueDate: new Date().toISOString(),
      progress: 0,
      completed: false
    });
    setModalVisible(false);
  };

  // Set the task to Upcoming
  const setToUpcoming = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask(task.id, {
      dueDate: tomorrow.toISOString(),
      progress: 0,
      completed: false
    });
    setModalVisible(false);
  };

  // Set the task to In Progress
  const setToInProgress = () => {
    updateTask(task.id, {
      progress: task.progress > 0 ? task.progress : 10,
      completed: false
    });
    setModalVisible(false);
  };

  // Set the task to Completed
  const setToCompleted = () => {
    updateTask(task.id, {
      progress: 100,
      completed: true
    });
    setModalVisible(false);
  };

  // Determine current status for display
  let currentStatus = 'Unknown';
  let statusColor = '#666';

  if (task.completed) {
    currentStatus = 'Completed';
    statusColor = '#4CAF50';
  } else if (task.progress && task.progress > 0 && task.progress < 100) {
    currentStatus = 'In Progress';
    statusColor = '#FF9800';
  } else {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate.getTime() === today.getTime()) {
      currentStatus = 'Today';
      statusColor = '#2196F3';
    } else if (dueDate > today) {
      currentStatus = 'Upcoming';
      statusColor = '#9C27B0';
    } else {
      currentStatus = 'Overdue';
      statusColor = '#F44336';
    }
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.statusButton, { borderColor: statusColor }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.statusText, { color: statusColor }]}>
          {currentStatus}
        </Text>
        <Ionicons name="chevron-down" size={14} color={statusColor} />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move to</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={setToToday}
            >
              <Ionicons name="today-outline" size={20} color="#2196F3" />
              <Text style={styles.optionText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={setToUpcoming}
            >
              <Ionicons name="calendar-outline" size={20} color="#9C27B0" />
              <Text style={styles.optionText}>Upcoming</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={setToInProgress}
            >
              <Ionicons name="hourglass-outline" size={20} color="#FF9800" />
              <Text style={styles.optionText}>In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={setToCompleted}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.optionText}>Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
});

export default TaskStatusButton;
