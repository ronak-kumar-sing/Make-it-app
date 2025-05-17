// Simple helper for model fallback strategies

/**
 * Attempts to execute a function with multiple retries and fallbacks
 * @param {Function} primaryFn - The primary function to execute
 * @param {Function[]} fallbackFns - Array of fallback functions to try if primary fails
 * @param {Object} options - Options for retry behavior
 * @returns {Promise<any>} - Result from the first successful function execution
 */
const tryWithFallbacks = async (primaryFn, fallbackFns = [], options = {}) => {
  const { maxRetries = 3, delay = 1000 } = options;

  // Try the primary function with retries
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await primaryFn();
    } catch (error) {
      console.log(`Primary function attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If primary function failed after all retries, try fallbacks
  for (let i = 0; i < fallbackFns.length; i++) {
    try {
      console.log(`Trying fallback function ${i + 1}`);
      return await fallbackFns[i]();
    } catch (error) {
      console.log(`Fallback function ${i + 1} failed:`, error.message);
    }
  }

  // If all attempts failed
  throw new Error('All model attempts exhausted. No fallback succeeded.');
};

// Higher-level wrapper function for model calls with retry and fallback logic
const executeWithFallback = async (modelCall) => {
  try {
    return await modelCall();
  } catch (error) {
    // Check if the error is due to model overload (503 Service Unavailable)
    if (error.message && (error.message.includes('overloaded') || error.message.includes('503'))) {
      console.log('Model overloaded, trying fallback model...');

      // Create fallback model
      const fallbackModel = genAI.getGenerativeModel({ model: MODELS.FALLBACK });

      try {
        return await fallbackModel.generateContent(...arguments);
      } catch (fallbackError) {
        console.log('Fallback model also failed, trying last resort model...');

        // Create last resort model
        const lastResortModel = genAI.getGenerativeModel({ model: MODELS.LAST_RESORT });

        // Final attempt with last resort model
        return await lastResortModel.generateContent(...arguments);
      }
    }

    // If it's not an overload error, re-throw
    throw error;
  }
};

// Wrapping generateContent with automatic fallback
const generateContentWithFallback = async (model, params) => {
  for (const modelName of [MODELS.PRIMARY, MODELS.FALLBACK, MODELS.LAST_RESORT]) {
    try {
      console.log(`Trying model: ${modelName}`);
      const currentModel = genAI.getGenerativeModel({ model: modelName });
      return await currentModel.generateContent(params);
    } catch (error) {
      // If this is the last model option and it failed, throw the error
      if (modelName === MODELS.LAST_RESORT) {
        throw error;
      }

      // Check if the error is due to model overload (503 Service Unavailable)
      if (!(error.message && (error.message.includes('overloaded') || error.message.includes('503')))) {
        throw error; // If not an overload error, stop trying
      }

      console.log(`Model ${modelName} overloaded, trying next model...`);
      // Continue to next model in loop
    }
  }
};

export default {
  tryWithFallbacks,
  executeWithFallback,
  generateContentWithFallback
};
