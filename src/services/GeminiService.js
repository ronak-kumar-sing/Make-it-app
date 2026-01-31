/**
 * GeminiService.js
 * Provides AI functions for generating study resources, images, and more using Google's Gemini API.
 */

import { resilientModel } from './ResilientModelService.js';

/**
 * Processes the raw result from Gemini API into structured study resources
 * @param {Object} result - Raw API response
 * @param {string} topic - The topic requested
 * @param {number} count - Number of resources to return
 * @returns {Array} Structured resources
 */
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

/**
 * Generate study resources based on a topic
 * @param {string} topic - The subject or topic to generate resources for
 * @param {number} [count=3] - Number of resources to generate
 * @returns {Promise<Array>} - List of generated resources
 */
export async function generateStudyResources(topic, count = 3) {
  try {
    // Setting up proper generative config for Gemini models
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

    // Use resilient model with automatic retry and fallback logic
    const result = await resilientModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    return processStudyResourcesResult(result, topic, count);
  } catch (error) {
    console.error('Error generating study resources:', error);
    throw error;
  }
}

/**
 * Generate an image related to a study topic
 * @param {string} topic - The subject or topic to generate an image for
 * @returns {Promise<string>} - Base64 encoded image data or URL
 */
export async function generateStudyImage(topic) {
  try {
    // Since Gemini doesn't directly generate images, we'll use a text prompt
    // to give suggestions for images or return a placeholder
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

    // Use resilient model with retry and fallback logic
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
}

/**
 * Ask a question about a study topic
 * @param {string} question - The question to ask
 * @param {string} [context] - Optional context or subject area
 * @returns {Promise<string>} - The answer
 */
export async function askStudyQuestion(question, context = '') {
  try {
    const generationConfig = {
      temperature: 0.6,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 768,
    };

    const prompt = context
      ? `In the context of ${context}, please answer the following question: ${question}`
      : question;

    // Use resilient model with retry and fallback logic
    const result = await resilientModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    return result.response.text();
  } catch (error) {
    console.error('Error asking study question:', error);
    throw error;
  }
}

/**
 * Generate flashcards for studying
 * @param {string} topic - The subject or topic
 * @param {number} [count=5] - Number of flashcards to generate
 * @returns {Promise<Array>} - List of flashcard objects with front and back
 */
export async function generateFlashcards(topic, count = 5) {
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

    // Use resilient model with retry and fallback logic
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

// Create a default export with all functions
const GeminiService = {
  generateStudyResources,
  generateStudyImage,
  askStudyQuestion,
  generateFlashcards
};

export default GeminiService;
