import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  hasRequestedPermissions,
  PermissionStatuses,
  requestAllPermissions
} from '../services/PermissionsManager';

interface PermissionsInitializerProps {
  onPermissionsInitialized?: (statuses: PermissionStatuses) => void;
}

/**
 * Component that handles requesting permissions when the app starts
 * This is designed to be added to the root component
 */
export default function PermissionsInitializer({ onPermissionsInitialized }: PermissionsInitializerProps) {
  const [permissionsHandled, setPermissionsHandled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    initializePermissions();
  }, []);

  /**
   * Check and request permissions on first app launch
   */
  const initializePermissions = async () => {
    try {
      // Check if we've already requested permissions
      const alreadyRequested = await hasRequestedPermissions();

      if (!alreadyRequested) {
        // Show the dialog first time
        setShowDialog(true);
      } else {
        // Already handled previously, mark as done
        setPermissionsHandled(true);
      }
    } catch (error) {
      console.error('Error initializing permissions:', error);
      setPermissionsHandled(true);
    }
  };

  /**
   * Proceed with requesting all permissions
   */
  const handleContinue = async () => {
    setShowDialog(false);

    // Request all permissions
    const statuses = await requestAllPermissions();

    // Notify parent component if needed
    if (onPermissionsInitialized) {
      onPermissionsInitialized(statuses);
    }

    // Mark as handled
    setPermissionsHandled(true);
  };

  /**
   * Skip requesting permissions
   */
  const handleSkip = () => {
    setShowDialog(false);
    setPermissionsHandled(true);
  };

  // This component returns null once permissions are handled
  if (permissionsHandled && !showDialog) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={showDialog}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>App Permissions</Text>
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            To provide the best experience, Make-it needs access to:
          </Text>

          <View style={styles.permissionsContainer}>
            <View style={styles.permissionRow}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} style={styles.icon} />
              <View style={styles.permissionTextContainer}>
                <Text style={[styles.permissionTitle, { color: theme.text }]}>Notifications</Text>
                <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
                  For task reminders and exam notifications
                </Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <Ionicons name="folder-outline" size={24} color={theme.primary} style={styles.icon} />
              <View style={styles.permissionTextContainer}>
                <Text style={[styles.permissionTitle, { color: theme.text }]}>Storage</Text>
                <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
                  For saving your data and backups
                </Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <Ionicons name="images-outline" size={24} color={theme.primary} style={styles.icon} />
              <View style={styles.permissionTextContainer}>
                <Text style={[styles.permissionTitle, { color: theme.text }]}>Photo Library</Text>
                <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
                  For adding images to your notes and resources
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.note, { color: theme.textSecondary }]}>
            You can change permission settings at any time in your device settings.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { borderColor: theme.border }]}
              onPress={handleSkip}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.primary }]}
              onPress={handleContinue}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: '85%',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionsContainer: {
    marginBottom: 24,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 16,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  buttonPrimary: {
    // Background color set via theme
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
