import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useContext, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context';

const ResourcesScreen = () => {
  const { resources, subjects, addResource, updateResource, deleteResource } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    subject: '',
    type: 'note', // 'note', 'document', 'link'
    content: '',
    uri: '',
  });

  // Filter resources based on search query and selected subject
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || resource.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // Group resources by type
  const groupedResources = filteredResources.reduce((groups, resource) => {
    const type = resource.type || 'note';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(resource);
    return groups;
  }, {});

  // Pick a document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.type === 'success') {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(result.uri);

        // Check file size (limit to 10MB for local storage)
        if (fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('File is too large. Please select a file smaller than 10MB.');
          return;
        }

        // Copy file to app's documents directory for persistence
        const newUri = FileSystem.documentDirectory + result.name;
        await FileSystem.copyAsync({
          from: result.uri,
          to: newUri
        });

        setNewResource({
          ...newResource,
          title: result.name,
          type: 'document',
          uri: newUri
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Failed to pick document.');
    }
  };

  // Save new resource
  const saveResource = () => {
    if (!newResource.title) {
      Alert.alert('Please enter a title for the resource.');
      return;
    }

    if (newResource.id) {
      updateResource(newResource.id, newResource);
    } else {
      addResource(newResource);
    }

    setModalVisible(false);
    setNewResource({
      title: '',
      description: '',
      subject: '',
      type: 'note',
      content: '',
      uri: '',
    });
  };

  // Open a resource
  const openResource = async (resource) => {
    if (resource.type === 'document' && resource.uri) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resource.uri);
      } else {
        Alert.alert('Sharing is not available on this device');
      }
    } else if (resource.type === 'note') {
      // Show note content in a modal
      setNewResource(resource);
      setModalVisible(true);
    }
  };

  // Delete a resource
  const confirmDeleteResource = (id) => {
    Alert.alert(
      'Delete Resource',
      'Are you sure you want to delete this resource?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteResource(id),
        },
      ]
    );
  };

  // Render a resource item
  const renderResourceItem = ({ item }) => {
    const subjectColor = subjects.find(s => s.name === item.subject)?.color || '#607D8B';

    return (
      <TouchableOpacity
        style={styles.resourceItem}
        onPress={() => openResource(item)}
      >
        <View style={styles.resourceIcon}>
          <Ionicons
            name={
              item.type === 'document'
                ? 'document-text'
                : item.type === 'link'
                ? 'link'
                : 'create'
            }
            size={24}
            color={subjectColor}
          />
        </View>

        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.resourceDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          {item.subject && (
            <View style={[styles.subjectTag, { backgroundColor: `${subjectColor}20` }]}>
              <Text style={[styles.subjectText, { color: subjectColor }]}>
                {item.subject}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteResource(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Resources</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewResource({
              title: '',
              description: '',
              subject: '',
              type: 'note',
              content: '',
              uri: '',
            });
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedSubject === 'All' && styles.activeFilter
            ]}
            onPress={() => setSelectedSubject('All')}
          >
            <Text
              style={[
                styles.filterText,
                selectedSubject === 'All' && styles.activeFilterText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.filterButton,
                selectedSubject === subject.name && styles.activeFilter,
                selectedSubject === subject.name && { backgroundColor: `${subject.color}20` }
              ]}
              onPress={() => setSelectedSubject(subject.name)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedSubject === subject.name && styles.activeFilterText,
                  selectedSubject === subject.name && { color: subject.color }
                ]}
              >
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {Object.keys(groupedResources).length > 0 ? (
        <FlatList
          data={Object.keys(groupedResources)}
          keyExtractor={(item) => item}
          renderItem={({ item: type }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </Text>
              {groupedResources[type].map(resource => renderResourceItem({ item: resource }))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book" size={64} color="#DDD" />
          <Text style={styles.emptyStateTitle}>No resources found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? "No resources match your search"
              : "You haven't added any study resources yet"}
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              setNewResource({
                title: '',
                description: '',
                subject: '',
                type: 'note',
                content: '',
                uri: '',
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.emptyStateButtonText}>Add Resource</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Resource Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {newResource.id ? 'Edit Resource' : 'Add Resource'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Resource Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newResource.type === 'note' && styles.activeTypeButton
                    ]}
                    onPress={() => setNewResource({ ...newResource, type: 'note' })}
                  >
                    <Ionicons
                      name="create"
                      size={20}
                      color={newResource.type === 'note' ? '#FFFFFF' : '#6C63FF'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        newResource.type === 'note' && styles.activeTypeText
                      ]}
                    >
                      Note
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newResource.type === 'document' && styles.activeTypeButton
                    ]}
                    onPress={() => pickDocument()}
                  >
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={newResource.type === 'document' ? '#FFFFFF' : '#6C63FF'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        newResource.type === 'document' && styles.activeTypeText
                      ]}
                    >
                      Document
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newResource.type === 'link' && styles.activeTypeButton
                    ]}
                    onPress={() => setNewResource({ ...newResource, type: 'link' })}
                  >
                    <Ionicons
                      name="link"
                      size={20}
                      color={newResource.type === 'link' ? '#FFFFFF' : '#6C63FF'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        newResource.type === 'link' && styles.activeTypeText
                      ]}
                    >
                      Link
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={newResource.title}
                  onChangeText={(text) => setNewResource({ ...newResource, title: text })}
                  placeholder="Enter resource title"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newResource.description}
                  onChangeText={(text) => setNewResource({ ...newResource, description: text })}
                  placeholder="Enter resource description"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Subject</Text>
                <View style={styles.subjectContainer}>
                  {subjects.map(subject => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectTag,
                        newResource.subject === subject.name && { backgroundColor: `${subject.color}20` }
                      ]}
                      onPress={() => setNewResource({ ...newResource, subject: subject.name })}
                    >
                      <Text
                        style={[
                          styles.subjectText,
                          newResource.subject === subject.name && { color: subject.color }
                        ]}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {newResource.type === 'note' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Content</Text>
                  <TextInput
                    style={[styles.input, styles.contentArea]}
                    value={newResource.content}
                    onChangeText={(text) => setNewResource({ ...newResource, content: text })}
                    placeholder="Enter your notes here"
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {newResource.type === 'link' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>URL</Text>
                  <TextInput
                    style={styles.input}
                    value={newResource.uri}
                    onChangeText={(text) => setNewResource({ ...newResource, uri: text })}
                    placeholder="Enter URL"
                    keyboardType="url"
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveResource}
            >
              <Text style={styles.saveButtonText}>Save Resource</Text>
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
    backgroundColor: '#F8F9FA',
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
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#EEEEEE',
  },
  activeFilter: {
    backgroundColor: '#E0DDFF',
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F0EEFF',
    marginRight: 8,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  deleteButton: {
    padding: 8,
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
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    backgroundColor: '#6C63FF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#333',
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
    height: 80,
  },
  contentArea: {
    height: 150,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#6C63FF',
  },
  typeText: {
    color: '#6C63FF',
    marginLeft: 8,
  },
  activeTypeText: {
    color: '#FFFFFF',
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
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

export default ResourcesScreen;
