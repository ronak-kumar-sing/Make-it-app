import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskSelectionItemProps {
  task: any;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
}

const TaskSelectionItem = ({ task, isSelected, onSelect, theme }: TaskSelectionItemProps) => {
  // Get color based on priority
  const getPriorityColor = () => {
    switch (task.priority) {
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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.card },
        isSelected && { backgroundColor: theme.primaryLight }
      ]}
      onPress={onSelect}
    >
      <View style={styles.selectionInfo}>
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={isSelected ? theme.primary : theme.textSecondary}
        />

        {task.priority && (
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor() }
            ]}
          />
        )}

        <Text
          style={[
            styles.title,
            { color: theme.text },
            isSelected && { color: theme.primary, fontWeight: '500' }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {task.title}
        </Text>
      </View>

      {(task.progress !== undefined && task.progress > 0 && task.progress < 100) && (
        <Text style={[styles.progressText, { color: theme.primary }]}>
          {task.progress}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TaskSelectionItem;
