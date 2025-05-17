import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
// Import the resilient model directly
import { resilientModel } from '../services/ResilientModelService.js';

// Temporary solution: Define the necessary functions locally
// These functions are copied from GeminiService.js to avoid import issues
const processStudyResourcesResult = (result, topic, count) => {
  const textResult = result.response.text();

  // Extract JSON from the response
  const jsonMatch = textResult.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.log('JSON parsing error:', e);
    }
  }

  // Fallback parsing if the model doesn't return clean JSON
  try {
    return JSON.parse(textResult);
  } catch {
    // If JSON parsing fails, extract structured data manually
    const resources = [];
    const sections = textResult.split(/Resource \d+:|(?=\{\s*"title":)/);

    for (const section of sections) {
      if (!section.trim()) continue;

      const titleMatch = section.match(/"?title"?\s*:?\s*"?([^"]+)"?/i);
      const descriptionMatch = section.match(/"?description"?\s*:?\s*"?([^"]+(?:"[^"]*)*)"?/i);
      const keyPointsStr = section.match(/"?keyPoints"?\s*:?\s*\[([\s\S]*?)\]/i)?.[1] ||
                       section.match(/key points to remember[:\s]*([\s\S]*?)(?=\n\n|\Z)/i)?.[1];

      const keyPoints = keyPointsStr ?
        keyPointsStr.split(/,|\n/).map(point => point.replace(/^["'\s-•]+|["'\s]+$/g, ''))
          .filter(point => point) : [];

      if (titleMatch || descriptionMatch || keyPoints.length) {
        resources.push({
          title: titleMatch ? titleMatch[1].trim() : `Resource on ${topic}`,
          description: descriptionMatch ? descriptionMatch[1].trim() : '',
          keyPoints: keyPoints
        });
      }
    }

    return resources.slice(0, count);
  }
};

// GeminiService replacement object with required methods
const GeminiService = {
  async generateStudyResources(topic, count = 3) {
    try {
      const generationConfig = {
        temperature: 0.6,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      const prompt = `
        Generate ${count} structured study resources for the topic "${topic}".
        For each resource, provide:
        1. A title
        2. A brief description (2-3 sentences)
        3. Key points to remember (3-5 bullet points)

        Format the response as a JSON array with objects containing:
        { "title", "description", "keyPoints" }

        Make the content educational, accurate, and helpful for a student studying this topic.
      `;

      const result = await resilientModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      return processStudyResourcesResult(result, topic, count);
    } catch (error) {
      console.error('Error generating study resources:', error);
      throw error;
    }
  },

  async generateStudyImage(topic) {
    try {
      const generationConfig = {
        temperature: 0.6,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 768,
      };

      const prompt = `
        I need an educational image for the topic "${topic}".
        Please describe what would make an effective educational image for this topic.
        Also provide a link to a Creative Commons image that might be useful, if available.
      `;

      const result = await resilientModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const textResult = result.response.text();

      // Try to extract any image URLs mentioned in the response
      const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/gi;
      const imageUrls = textResult.match(urlRegex);

      if (imageUrls && imageUrls.length > 0) {
        return imageUrls[0]; // Return the first image URL found
      }

      // If no image URLs found, return description
      return {
        description: textResult,
        url: null
      };
    } catch (error) {
      console.error('Error generating study image description:', error);
      throw error;
    }
  },

  async generateFlashcards(topic, count = 5) {
    try {
      const generationConfig = {
        temperature: 0.6,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      const prompt = `
        Generate ${count} educational flashcards for studying "${topic}".
        Format the response as a JSON array with objects containing:
        { "front": "question or concept", "back": "answer or explanation" }

        Make sure the flashcards cover key concepts, definitions, formulas, or important facts about the topic.
      `;

      const result = await resilientModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const textResult = result.response.text();

      // Extract JSON from the response
      const jsonMatch = textResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          console.log('JSON parsing error:', e);
        }
      }

      // Fallback parsing if the model doesn't return clean JSON
      try {
        return JSON.parse(textResult);
      } catch {
        // If JSON parsing fails, extract structured data manually
        const flashcards = [];
        const sections = textResult.split(/Flashcard \d+:|(?=\{\s*"front":)/);

        for (const section of sections) {
          if (!section.trim()) continue;

          const frontMatch = section.match(/"?front"?\s*:?\s*"?([^"]+)"?/i);
          const backMatch = section.match(/"?back"?\s*:?\s*"?([^"]+)"?/i);

          if (frontMatch && backMatch) {
            flashcards.push({
              front: frontMatch[1].trim(),
              back: backMatch[1].trim()
            });
          }
        }

        return flashcards.slice(0, count);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw error;
    }
  }
};

const AIResourceGenerator = ({ visible, onClose, onSaveResource }) => {
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResources, setGeneratedResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [step, setStep] = useState('input'); // 'input', 'results', 'detail'

  // Generate resources using Gemini API
  const generateResources = async () => {
    if (!topic.trim()) {
      Alert.alert('Please enter a study topic');
      return;
    }

    setGenerating(true);
    try {
      const resources = await GeminiService.generateStudyResources(topic, 3);
      setGeneratedResources(resources);

      // Also generate an image
      try {
        const imageResult = await GeminiService.generateStudyImage(topic);
        if (typeof imageResult === 'string') {
          setImageUrl(imageResult);
        } else if (imageResult && imageResult.url) {
          setImageUrl(imageResult.url);
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        // Continue even if image generation fails
      }

      setStep('results');
    } catch (error) {
      console.error('Resource generation error:', error);

      // Check for API key issues
      if (error.message && error.message.includes('API key')) {
        Alert.alert(
          'API Key Error',
          'Please check your Gemini API key in app/config/apiKeys.js and ensure you have set up access to Gemini 2.0 models. See GEMINI_SETUP.md for instructions.'
        );
      } else if (error.message && error.message.includes('models') || error.message.includes('not found')) {
        Alert.alert(
          'Model Error',
          'The Gemini model could not be accessed. Please verify your API key has access to Gemini 2.0 models.'
        );
      } else if (error.message && (error.message.includes('overloaded') || error.message.includes('503'))) {
        // This shouldn't happen anymore with our resilient model service, but just in case
        Alert.alert(
          'Service Unavailable',
          'The Gemini service is currently overloaded. Our system has tried alternative models, but all are busy. Please try again in a few moments.'
        );
      } else if (error.message && error.message.includes('exhausted')) {
        Alert.alert(
          'Models Unavailable',
          'We tried multiple Gemini models, but all attempts failed. This might be due to temporary service issues. Please try again later.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to generate resources. Please check your internet connection and try again.'
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  // View details of a selected resource
  const viewResourceDetails = (resource) => {
    setSelectedResource(resource);
    setStep('detail');
  };

  // Save a resource to the app's collection
  const saveResource = (resource) => {
    const newResource = {
      title: resource.title,
      description: resource.description,
      content: resource.keyPoints.join('\n• '),
      type: 'note',
      subject: topic,
      aiGenerated: true,
      imageUrl: imageUrl || null
    };

    onSaveResource(newResource);
    Alert.alert('Success', 'Resource saved successfully!');
  };

  // Reset and close the generator
  const handleClose = () => {
    setTopic('');
    setGeneratedResources([]);
    setSelectedResource(null);
    setImageUrl(null);
    setStep('input');
    onClose();
  };

  // Save response to AsyncStorage
  const saveResponseLocally = async (resource) => {
    try {
      // Create a unique key for the saved resource
      const key = `ai_resource_${Date.now()}`;

      // Format the resource data to save
      const resourceToSave = {
        id: key,
        title: resource.title,
        description: resource.description,
        keyPoints: resource.keyPoints,
        topic: topic,
        imageUrl: imageUrl,
        savedAt: new Date().toISOString(),
      };

      // Get existing saved resources or initialize empty array
      const savedResourcesJSON = await AsyncStorage.getItem('saved_ai_resources');
      const savedResources = savedResourcesJSON ? JSON.parse(savedResourcesJSON) : [];

      // Add new resource to array
      savedResources.push(resourceToSave);

      // Save back to AsyncStorage
      await AsyncStorage.setItem('saved_ai_resources', JSON.stringify(savedResources));

      Alert.alert('Saved Locally', 'This AI response has been saved to your device for offline access.');
    } catch (error) {
      console.error('Error saving resource locally:', error);
      Alert.alert('Error', 'Failed to save resource locally.');
    }
  };

  // Convert resource to flashcards
  const convertToFlashcards = async (resource) => {
    setGenerating(true);
    try {
      const flashcards = await GeminiService.generateFlashcards(resource.title, 5);
      const flashcardsContent = flashcards.map(card =>
        `Q: ${card.front}\nA: ${card.back}`
      ).join('\n\n');

      const flashcardResource = {
        title: `Flashcards: ${resource.title}`,
        description: `AI-generated flashcards for studying ${resource.title}`,
        content: flashcardsContent,
        type: 'note',
        subject: topic,
        aiGenerated: true,
        isFlashcards: true
      };

      onSaveResource(flashcardResource);
      Alert.alert('Success', 'Flashcards created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create flashcards. Please try again.');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Save all generated resources to local storage
  const saveAllResourcesLocally = async () => {
    try {
      if (generatedResources.length === 0) {
        Alert.alert('No Resources', 'There are no resources to save.');
        return;
      }

      // Get existing saved resources or initialize empty array
      const savedResourcesJSON = await AsyncStorage.getItem('saved_ai_resources');
      const savedResources = savedResourcesJSON ? JSON.parse(savedResourcesJSON) : [];

      // Create entries for each resource
      const resourcesWithMetadata = generatedResources.map(resource => ({
        id: `ai_resource_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: resource.title,
        description: resource.description,
        keyPoints: resource.keyPoints,
        topic: topic,
        imageUrl: imageUrl,
        savedAt: new Date().toISOString(),
      }));

      // Add new resources to array
      const updatedSavedResources = [...savedResources, ...resourcesWithMetadata];

      // Save back to AsyncStorage
      await AsyncStorage.setItem('saved_ai_resources', JSON.stringify(updatedSavedResources));

      Alert.alert('All Resources Saved', 'All generated resources have been saved to your device for offline access.');
    } catch (error) {
      console.error('Error saving resources locally:', error);
      Alert.alert('Error', 'Failed to save resources locally.');
    }
  };

  // Render the input screen
  const renderInputScreen = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.title, { color: theme.text }]}>AI Study Resource Generator</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Enter a study topic and let AI generate helpful study resources for you!
      </Text>

      <TextInput
        style={[styles.input, {
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.border
        }]}
        placeholder="Enter a study topic or subject (e.g., Photosynthesis)"
        placeholderTextColor={theme.textSecondary}
        value={topic}
        onChangeText={setTopic}
      />

      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: theme.primary }]}
        onPress={generateResources}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate Resources</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render the results screen
  const renderResultsScreen = () => (
    <ScrollView style={[styles.resultsContainer, { backgroundColor: theme.background }]}>
      {/* Header section */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Study Resources</Text>
        <View style={[styles.topicBadgeLarge, { backgroundColor: theme.primary }]}>
          <Text style={styles.topicBadgeText}>{topic}</Text>
        </View>
      </View>

      {/* Topic image if available */}
      {imageUrl && (
        <View style={styles.topicImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.topicImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>AI-Generated Study Resources</Text>
          </View>
        </View>
      )}

      {/* Resources list */}
      <View style={styles.resourcesSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Resources</Text>
        <View style={styles.resourceListContainer}>
          {generatedResources.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.resourceCard, { backgroundColor: theme.card }]}
              onPress={() => viewResourceDetails(resource)}
            >
              <View style={styles.resourceCardContent}>
                <View style={[styles.resourceNumber, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.resourceNumberText, { color: theme.primary }]}>{index + 1}</Text>
                </View>
                <View style={styles.resourceItemContent}>
                  <Text style={[styles.resourceItemTitle, { color: theme.text }]}>{resource.title}</Text>
                  <Text style={[styles.resourceItemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {resource.description}
                  </Text>
                  <Text style={[styles.viewDetailsText, { color: theme.primary }]}>View details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.resultsActionsContainer}>
        <TouchableOpacity
          style={[styles.primaryActionButton, { backgroundColor: theme.primary }]}
          onPress={() => saveAllResourcesLocally()}
        >
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Save All Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryActionButton, { backgroundColor: theme.primaryLight }]}
          onPress={() => setStep('input')}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.primary} />
          <Text style={[styles.secondaryActionText, { color: theme.primary }]}>Try Another Topic</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render the detail screen
  const renderDetailScreen = () => (
    <ScrollView style={[styles.detailContainer, { backgroundColor: theme.background }]}>
      {/* Header with back button and topic */}
      <View style={styles.noteHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('results')}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
          <Text style={[styles.backButtonText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.topicBadge, { backgroundColor: theme.primaryLight, color: theme.primary }]}>{topic}</Text>
      </View>

      {/* Document-like preview card */}
      <View style={[styles.notePreviewCard, { backgroundColor: theme.card }]}>
        {/* Premium document header with AI badge & subject */}
        <View style={[styles.documentHeader, { backgroundColor: theme.primaryLight }]}>
          <View style={styles.documentHeaderContent}>
            <Text style={[styles.documentType, { color: theme.primary }]}>STUDY RESOURCE</Text>
            <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedResource.title}</Text>
            <View style={styles.documentMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{new Date().toDateString()}</Text>
              </View>
              <View style={[styles.aiBadge, { backgroundColor: theme.accent || '#FF8A65' }]}>
                <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
                <Text style={styles.aiBadgeText}>AI Generated</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick summary section */}
        <View style={styles.summarySection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SUMMARY</Text>
          <Text style={[styles.detailDescription, { color: theme.text }]}>{selectedResource.description}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Key points with better styling */}
        <View style={styles.contentSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>KEY POINTS</Text>
          <View style={styles.keyPointsList}>
            {selectedResource.keyPoints.map((point, index) => (
              <View key={index} style={styles.keyPointItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]}>
                  <Text style={styles.bulletPointText}>{index + 1}</Text>
                </View>
                <Text style={[styles.keyPointText, { color: theme.text }]}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Image section if available */}
        {imageUrl && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.contentSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RELATED VISUAL</Text>
              <View style={styles.noteImageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.noteImage}
                  resizeMode="contain"
                />
                <Text style={[styles.imageCaption, {
                  color: theme.textSecondary,
                  backgroundColor: theme.isDark ? theme.card : '#F8F9FA'
                }]}>Visual representation for "{topic}"</Text>
              </View>
            </View>
          </>
        )}

        {/* Document footer */}
        <View style={[styles.documentFooter, {
          backgroundColor: theme.isDark ? theme.background : '#FAFAFA',
          borderTopColor: theme.border
        }]}>
          <View style={styles.footerContent}>
            <Ionicons name="bookmark-outline" size={16} color={theme.primary} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Save this resource for offline access</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => saveResource(selectedResource)}
        >
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Save as Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => convertToFlashcards(selectedResource)}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Create Flashcards</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, {
            backgroundColor: theme.background,
            borderColor: theme.border
          }]}
          onPress={() => saveResponseLocally(selectedResource)}
        >
          <Ionicons name="download-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Save to Local Storage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>

          {step === 'input' && renderInputScreen()}
          {step === 'results' && renderResultsScreen()}
          {step === 'detail' && renderDetailScreen()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 12,
    width: '99%',
    height: '95%',
    paddingVertical: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  generateButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicBadgeLarge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  topicBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    marginBottom: 24,
  },
  topicImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resourcesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resourceListContainer: {
    marginBottom: 16,
  },
  resourceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resourceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  resourceNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resourceItemContent: {
    flex: 1,
  },
  resourceItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceItemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsActionsContainer: {
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  primaryActionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryActionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  topicBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  notePreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  documentHeaderContent: {
    alignItems: 'flex-start',
  },
  documentType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  aiBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  summarySection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  contentSection: {
    padding: 20,
  },
  keyPointsList: {
    marginTop: 8,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bulletPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  bulletPointText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  keyPointText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  noteImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  noteImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  imageCaption: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  documentFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    marginLeft: 6,
  },
  actionButtonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  localSaveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  localSaveAllButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  localSaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default AIResourceGenerator;