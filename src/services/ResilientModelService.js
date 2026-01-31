/**
 * ResilientModelService.js
 * Provides retry and fallback mechanisms for Gemini API calls
 */

import { GoogleGenerativeAI } from '@google/generative-ai';


const API_KEY = 'AIzaSyAr-3cbGf4Iz_c9z1Mn5ax0bbbLYERmpOM';
const genAI = new GoogleGenerativeAI(API_KEY);

// Available models for fallback strategy
const MODELS = {
  PRIMARY: 'gemini-2.0-flash',
  FALLBACK: 'gemini-1.5-flash',
  LAST_RESORT: 'gemini-pro'
};

// Max retry attempts for overloaded services
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

/**
 * A resilient model that handles service overload errors
 * through multiple retry attempts and model fallbacks
 */
class ResilientModel {
  constructor(initialModelName = MODELS.PRIMARY) {
    this.currentModelName = initialModelName;
    this.retryCount = 0;
  }

  /**
   * Creates appropriate model instance
   */
  _getModelInstance(modelName) {
    return genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Sleep function for retry delay
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate content with automatic retry and fallback logic
   */
  async generateContent(params) {
    // Try all models in sequence if needed
    const modelSequence = [
      this.currentModelName,
      MODELS.FALLBACK,
      MODELS.LAST_RESORT
    ];

    let lastError = null;

    // Try each model in sequence
    for (const modelName of modelSequence) {
      // Reset retry count for each model
      this.retryCount = 0;

      // Try the current model with retries
      while (this.retryCount < MAX_RETRIES) {
        try {
          const model = this._getModelInstance(modelName);
          console.log(`Trying model: ${modelName}, attempt ${this.retryCount + 1}/${MAX_RETRIES}`);

          const result = await model.generateContent(params);

          // If successful, update the current model name and return the result
          this.currentModelName = modelName; // Remember which model worked
          return result;
        } catch (error) {
          lastError = error;

          // Check if it's an overload error that we should retry
          if (error.message && (
              error.message.includes('overloaded') ||
              error.message.includes('503')
          )) {
            // Increment retry count
            this.retryCount++;

            if (this.retryCount < MAX_RETRIES) {
              console.log(`Model ${modelName} overloaded. Retrying in ${RETRY_DELAY_MS}ms...`);
              await this._sleep(RETRY_DELAY_MS);
              // Continue to next retry attempt
            } else {
              console.log(`Max retries (${MAX_RETRIES}) reached for model ${modelName}. Trying next model.`);
              // Will move to next model in sequence
              break;
            }
          } else {
            // For non-overload errors, throw immediately
            throw error;
          }
        }
      }
    }

    // If we've exhausted all models and retries, throw the last error
    throw lastError || new Error("Failed to generate content with all available models");
  }
}

// A resilient model service for AI resource generation
// This provides fallback mechanisms when primary models fail

/**
 * Basic API error handler with exponential backoff retry logic
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Options for retry behavior
 * @returns {Promise} - Promise resolving to the API response
 */
async function withRetry(apiCall, options = {}) {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.log(`API attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * ResilientModel class provides a more robust interface for model interactions
 * with automatic retries and fallbacks
 */
class ResilientModelDev {
  constructor() {
    // Mock implementation for development
    this.modelName = "gemini-pro";
    this.availableModels = ["gemini-pro", "gemini-1.0-pro", "text-bison"];
  }

  /**
   * Generate content with automatic retry and fallback logic
   */
  async generateContent(options) {
    // For simulation purposes, we're returning mock data
    return {
      response: {
        text: () => {
          const topic = (options.contents[0]?.parts[0]?.text || "").toLowerCase();

          if (topic.includes("study resources") || topic.includes("structured study resources")) {
            return JSON.stringify([
              {
                title: "Introduction to the Topic",
                description: "A comprehensive overview with definitions and core concepts.",
                keyPoints: [
                  "Historical context and background",
                  "Key terminology and definitions",
                  "Fundamental principles",
                  "Real-world applications"
                ]
              },
              {
                title: "Critical Analysis and Methods",
                description: "Explore analytical frameworks and methodological approaches.",
                keyPoints: [
                  "Analytical frameworks",
                  "Research methodologies",
                  "Key debates in the field",
                  "Comparative perspectives"
                ]
              },
              {
                title: "Practical Applications",
                description: "How to apply theoretical knowledge to real-world situations.",
                keyPoints: [
                  "Case studies and examples",
                  "Step-by-step processes",
                  "Common challenges and solutions",
                  "Best practices and techniques"
                ]
              }
            ]);
          }

          if (topic.includes("flashcards")) {
            return JSON.stringify([
              { front: "Question 1?", back: "Answer to question 1" },
              { front: "Key concept definition?", back: "The definition explained in detail" },
              { front: "Important formula?", back: "The formula with explanation" },
              { front: "Critical date or event?", back: "The relevant details about the date/event" },
              { front: "Application example?", back: "How this concept applies in practice" }
            ]);
          }

          if (topic.includes("image")) {
            return "This topic would be well illustrated with a diagram showing the relationship between key concepts. https://example.com/placeholder-image.jpg";
          }

          return "Generated content for: " + topic;
        }
      }
    };
  }

  /**
   * Try different model variants if the primary one fails
   */
  async tryAlternativeModels(prompt, options = {}) {
    // This would implement actual fallback logic in a production app
    return this.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      ...options
    });
  }
}

// Create an instance of ResilientModel to export
const resilientModel = new ResilientModel();

// Add default export for the resilientModel instance
export { MODELS, ResilientModel, resilientModel };
export default resilientModel;

