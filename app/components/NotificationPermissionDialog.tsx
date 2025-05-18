import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as NotificationService from '../services/NotificationService';
import { hasFullNotificationSupport, isUsingExpoGo } from '../services/NotificationWarning';

interface NotificationDialogProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
}

const NotificationPermissionDialog: React.FC<NotificationDialogProps> = ({ visible, onClose, theme }) => {
  const [requesting, setRequesting] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState(false);
  const [hasLimitations, setHasLimitations] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsExpoGo(isUsingExpoGo());
      setHasLimitations(!hasFullNotificationSupport());
    }
  }, [visible]);

  const handleEnableNotifications = async () => {
    try {
      setRequesting(true);
      const granted = await NotificationService.requestNotificationPermissions();

      if (granted) {
        // Permission granted successfully
        onClose();
      } else {
        // Permission was denied
        onClose();
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    } finally {
      setRequesting(false);
    }
  };

  const benefits = [
    { icon: 'time-outline', text: 'Get reminders before tasks are due' },
    { icon: 'calendar-outline', text: 'Don\'t miss important exams' },
    { icon: 'timer-outline', text: 'Know when your timer sessions end' },
    { icon: 'flame-outline', text: 'Keep your study streak going' },
    { icon: 'trophy-outline', text: 'Celebrate your achievements' }
  ];

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Enable Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Make the most of your study time with helpful notifications.
          </Text>

          {isExpoGo && hasLimitations ? (
            <View style={[styles.warningContainer, { backgroundColor: `${theme.danger}15` }]}>
              <Ionicons name="warning-outline" size={18} color={theme.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, { color: theme.danger }]}>
                {Platform.OS === 'android' ?
                  'Push notifications have limited functionality in Expo Go. For full features, use a development build.' :
                  'Some notification features may be limited in Expo Go.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Ionicons name={benefit.icon} size={22} color={theme.primary} style={styles.benefitIcon} />
                <Text style={[styles.benefitText, { color: theme.text }]}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: theme.textSecondary }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.primary }]}
              onPress={handleEnableNotifications}
              disabled={requesting}
            >
              {requesting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Enable</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPrimary: {
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationPermissionDialog;
