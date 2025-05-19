import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as PermissionsManager from '../services/PermissionsManager';

export default function PermissionsTestScreen({ navigation }) {
  const { theme } = useTheme();
  const [permissionStatuses, setPermissionStatuses] = useState({
    notifications: false,
    mediaLibrary: false,
    photoLibrary: false,
  });
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    const statuses = await PermissionsManager.checkAllPermissions();
    setPermissionStatuses(statuses);
  };

  const requestAllPermissions = async () => {
    const result = await PermissionsManager.requestAllPermissions();
    setPermissionStatuses(result);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      PermissionsManager.showPermissionsDeniedAlert('Photos', 'Photo library access is needed to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await checkCurrentPermissions();
    }
  };

  const saveImageToLibrary = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please take or pick an image first.');
      return;
    }

    const permissionResult = await MediaLibrary.requestPermissionsAsync();

    if (permissionResult.granted === false) {
      PermissionsManager.showPermissionsDeniedAlert('Media Library', 'Media library access is needed to save images.');
      return;
    }

    try {
      await MediaLibrary.saveToLibraryAsync(image);
      Alert.alert('Success', 'Image saved to library!');
      await checkCurrentPermissions();
    } catch (error) {
      Alert.alert('Error', 'Failed to save image to library.');
      console.error('Error saving image:', error);
    }
  };

  const renderPermissionStatus = (name: string, status: boolean) => {
    return (
      <View style={[styles.statusItem, { borderColor: theme.border }]}>
        <Text style={[styles.statusName, { color: theme.text }]}>{name}</Text>
        <View style={[styles.statusBadge, {
          backgroundColor: status ? `${theme.success}30` : `${theme.danger}30`,
          borderColor: status ? theme.success : theme.danger
        }]}>
          <Text style={[styles.statusText, {
            color: status ? theme.success : theme.danger
          }]}>
            {status ? 'Granted' : 'Not Granted'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>App Permissions</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Test and manage all permissions in one place
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Status</Text>
        <View style={styles.statusList}>
          {renderPermissionStatus('Notifications', permissionStatuses.notifications)}
          {renderPermissionStatus('Media Library', permissionStatuses.mediaLibrary)}
          {renderPermissionStatus('Photo Library', permissionStatuses.photoLibrary)}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={checkCurrentPermissions}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Test Permissions</Text>

        <View style={styles.testButtons}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={24} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>Photo Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={saveImageToLibrary}
          >
            <Ionicons name="save-outline" size={24} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>Save to Library</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={requestAllPermissions}
        >
          <Text style={styles.buttonText}>Request All Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryLight }]}
          onPress={() => {
            Alert.alert(
              'Open Settings?',
              'Would you like to open device settings to manage app permissions?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings', onPress: () => {
                    // Open device settings
                    import('expo-linking').then(Linking => {
                      Linking.openSettings();
                    });
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>Open Device Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusList: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  statusName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  testButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '30%',
  },
  testButtonText: {
    marginTop: 8,
    fontWeight: '500',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  image: {
    width: 240,
    height: 240,
    borderRadius: 8,
  },
});
