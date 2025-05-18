import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useContext, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AIResourceGenerator from '../components/AIResourceGenerator';
import FormattedNoteViewer from '../components/FormattedNoteViewer';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const ResourcesScreen = () => {
  const { theme } = useTheme();
  const { resources, subjects, addResource, updateResource, deleteResource } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [aiGeneratorVisible, setAiGeneratorVisible] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    subject: '',
    type: 'note', // 'note', 'document', 'link'
    content: '',
    uri: '',
    imageUrl: '', // For AI-generated images
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
      imageUrl: '',
    });
  };

  // Save AI-generated resource
  const saveAiResource = (aiResource) => {
    const resourceToSave = {
      title: aiResource.title,
      description: aiResource.description || '',
      subject: aiResource.subject || '',
      type: aiResource.type || 'note',
      content: aiResource.content || '',
      uri: aiResource.uri || '',
      imageUrl: aiResource.imageUrl || '',
      aiGenerated: true,
    };

    addResource(resourceToSave);
  };

  // Open a resource
  const openResource = async (resource, mode = 'preview') => {
    if (resource.type === 'document' && resource.uri) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resource.uri);
      } else {
        Alert.alert('Sharing is not available on this device');
      }
    } else if (resource.type === 'note') {
      // Set resource for viewing or editing
      setNewResource(resource);

      // Show the appropriate modal based on mode
      if (mode === 'edit') {
        setModalVisible(true);
      } else {
        setPreviewModalVisible(true);
      }
    }
  };

  // Edit resource
  const editResource = (resource) => {
    openResource(resource, 'edit');
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
        style={[
          styles.resourceItem,
          { backgroundColor: theme.card },
          item.aiGenerated && styles.aiResourceItem
        ]}
        onPress={() => openResource(item)}
        onLongPress={() => editResource(item)}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.resourceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.resourceIcon, { backgroundColor: theme.primaryLight }]}>
            <Ionicons
              name={
                item.type === 'document'
                  ? 'document-text'
                  : item.type === 'link'
                    ? 'link'
                    : item.aiGenerated
                      ? 'sparkles'
                      : 'create'
              }
              size={24}
              color={subjectColor}
            />
          </View>
        )}

        <View style={styles.resourceContent}>
          <Text style={[styles.resourceTitle, { color: theme.text }]}>
            {item.title}
            {item.aiGenerated && (
              <Text style={[styles.aiGeneratedBadge, { color: theme.accent }]}> • AI</Text>
            )}
          </Text>
          {item.description && (
            <Text style={[styles.resourceDescription, { color: theme.textSecondary }]} numberOfLines={1}>
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

          {item.type === 'note' && (
            <TouchableOpacity
              style={[styles.viewEditButton, { backgroundColor: theme.primaryLight }]}
              onPress={() => editResource(item)}
            >
              <Ionicons name="create-outline" size={14} color={theme.primary} />
              <Text style={[styles.viewEditButtonText, { color: theme.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteResource(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Study Resources</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.aiButton, { marginRight: 12, backgroundColor: theme.accent }]}
            onPress={() => setAiGeneratorVisible(true)}
          >
            <Ionicons name="sparkles" size={22} color={theme.buttonText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setNewResource({
                title: '',
                description: '',
                subject: '',
                type: 'note',
                content: '',
                uri: '',
                imageUrl: '',
              });
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color={theme.buttonText} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchContainer, {
        backgroundColor: theme.card,
        shadowColor: theme.isDark ? '#000000' : '#000000',
        shadowOpacity: theme.isDark ? 0.2 : 0.1,
      }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search resources..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedSubject === 'All'
                  ? theme.primaryLight
                  : theme.isDark ? theme.card : '#EEEEEE'
              },
              selectedSubject === 'All' && styles.activeFilter
            ]}
            onPress={() => setSelectedSubject('All')}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedSubject === 'All' ? theme.primary : theme.textSecondary },
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
                { backgroundColor: theme.isDark ? theme.card : '#EEEEEE' },
                selectedSubject === subject.name && styles.activeFilter,
                selectedSubject === subject.name && { backgroundColor: `${subject.color}20` }
              ]}
              onPress={() => setSelectedSubject(subject.name)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.textSecondary },
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
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </Text>
              {groupedResources[type].map(resource => (
                <React.Fragment key={resource.id}>
                  {renderResourceItem({ item: resource })}
                </React.Fragment>
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book" size={64} color={theme.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No resources found</Text>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            {searchQuery
              ? "No resources match your search"
              : "You haven't added any study resources yet"}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
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
            <Text style={[styles.emptyStateButtonText, { color: theme.buttonText }]}>Add Resource</Text>
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
        <View style={[styles.modalContainer, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {newResource.id ? 'Edit Resource' : 'Add Resource'}
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
                <Text style={[styles.label, { color: theme.text }]}>Resource Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: theme.primaryLight },
                      newResource.type === 'note' && [styles.activeTypeButton, { backgroundColor: theme.primary }]
                    ]}
                    onPress={() => setNewResource({ ...newResource, type: 'note' })}
                  >
                    <Ionicons
                      name="create"
                      size={20}
                      color={newResource.type === 'note' ? theme.buttonText : theme.primary}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: theme.primary },
                        newResource.type === 'note' && [styles.activeTypeText, { color: theme.buttonText }]
                      ]}
                    >
                      Note
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: theme.primaryLight },
                      newResource.type === 'document' && [styles.activeTypeButton, { backgroundColor: theme.primary }]
                    ]}
                    onPress={() => pickDocument()}
                  >
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={newResource.type === 'document' ? theme.buttonText : theme.primary}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: theme.primary },
                        newResource.type === 'document' && [styles.activeTypeText, { color: theme.buttonText }]
                      ]}
                    >
                      Document
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: theme.primaryLight },
                      newResource.type === 'link' && [styles.activeTypeButton, { backgroundColor: theme.primary }]
                    ]}
                    onPress={() => setNewResource({ ...newResource, type: 'link' })}
                  >
                    <Ionicons
                      name="link"
                      size={20}
                      color={newResource.type === 'link' ? theme.buttonText : theme.primary}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: theme.primary },
                        newResource.type === 'link' && [styles.activeTypeText, { color: theme.buttonText }]
                      ]}
                    >
                      Link
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newResource.title}
                  onChangeText={(text) => setNewResource({ ...newResource, title: text })}
                  placeholder="Enter resource title"
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
                  value={newResource.description}
                  onChangeText={(text) => setNewResource({ ...newResource, description: text })}
                  placeholder="Enter resource description"
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
                  <Text style={[styles.label, { color: theme.text }]}>Content</Text>
                  <Text style={[styles.formattingHint, { color: theme.textSecondary }]}>
                    Supports formatting: #Headings, **bold**, *italic*, lists (1. items), bullet points (- items), URLs, and [links](https://example.com)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.contentArea,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }
                    ]}
                    value={newResource.content}
                    onChangeText={(text) => setNewResource({ ...newResource, content: text })}
                    placeholder="Enter your notes here"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {newResource.type === 'link' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>URL</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={newResource.uri}
                    onChangeText={(text) => setNewResource({ ...newResource, uri: text })}
                    placeholder="Enter URL"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="url"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              {newResource.type === 'note' && newResource.content && (
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: theme.success }]}
                  onPress={() => {
                    setModalVisible(false);
                    setPreviewModalVisible(true);
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={theme.buttonText} />
                  <Text style={[styles.previewButtonText, { color: theme.buttonText }]}>Preview</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.primary },
                  newResource.type === 'note' && newResource.content ? { flex: 2 } : { flex: 1 }
                ]}
                onPress={saveResource}
              >
                <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>Save Resource</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Resource Generator */}
      <AIResourceGenerator
        visible={aiGeneratorVisible}
        onClose={() => setAiGeneratorVisible(false)}
        onSaveResource={saveAiResource}
        theme={theme}
      />

      {/* Resource Preview Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.previewModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Study Notes</Text>
                <View style={[styles.previewBadge, { backgroundColor: theme.success }]}>
                  <Ionicons name="eye-outline" size={14} color={theme.buttonText} />
                  <Text style={[styles.previewBadgeText, { color: theme.buttonText }]}>Preview Mode</Text>
                </View>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={[styles.editButton, { marginRight: 8, backgroundColor: theme.primary }]}
                  onPress={() => {
                    setPreviewModalVisible(false);
                    setModalVisible(true); // Open edit modal
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={theme.buttonText} />
                  <Text style={[styles.editButtonText, { color: theme.buttonText }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPreviewModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.noteViewerContainer, { backgroundColor: theme.background }]}>
              <FormattedNoteViewer note={newResource} theme={theme} />
            </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  activeFilter: {
    fontWeight: 'bold',
  },
  filterText: {
    fontWeight: '500',
  },
  activeFilterText: {
    fontWeight: 'bold',
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
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiResourceItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF8A65',
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  aiGeneratedBadge: {
    fontSize: 12,
    color: '#FF8A65',
    fontWeight: 'bold',
  },
  resourceDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
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
    padding: 8,
  },
  modalContent: {
    borderRadius: 12,
    width: '95%',
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  formattingHint: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
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
    marginLeft: 8,
  },
  activeTypeText: {
    color: '#FFFFFF',
  },
  subjectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
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
  editButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  viewEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewEditButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  noteViewerContainer: {
    flex: 1,
    borderRadius: 8,
  },
  previewModalContent: {
    borderRadius: 12,
    padding: 10,
    paddingBottom: 8,
    flexDirection: 'column',
  },
});

export default ResourcesScreen;