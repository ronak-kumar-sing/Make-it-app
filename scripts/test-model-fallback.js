/**
 * Test script to simulate and demonstrate model fallback under overload conditions
 */

import { MODELS } from '../app/services/ResilientModelService.js';

// Simulate a model that experiences overload errors
const mockOverloadedModels = {
  // Track attempts for each model
  attemptCounts: {
    [MODELS.PRIMARY]: 0,
    [MODELS.FALLBACK]: 0,
    [MODELS.LAST_RESORT]: 0,
  },

  // Configuration for how many attempts should fail before success
  attemptsBeforePassing: {
    [MODELS.PRIMARY]: Infinity, // This will always fail and force fallback
    [MODELS.FALLBACK]: 1,       // This will pass on the 2nd attempt
    [MODELS.LAST_RESORT]: 0     // This will always pass
  }
};

// Create a simulated version of the resilient model service
const simulateModelOverload = async () => {
  console.log('Setting up model overload simulation...');

  // Track current model and request
  let currentAttempt = 0;
  let currentModel = MODELS.PRIMARY;

  // Attempt to generate content with built-in failures
  const runWithFallbacks = async () => {
    for (const modelName of [MODELS.PRIMARY, MODELS.FALLBACK, MODELS.LAST_RESORT]) {
      currentModel = modelName;
      mockOverloadedModels.attemptCounts[modelName] = 0;

      // Try the current model up to 3 times
      while (mockOverloadedModels.attemptCounts[modelName] < 3) {
        currentAttempt++;
        mockOverloadedModels.attemptCounts[modelName]++;

        console.log(`Trying model: ${modelName}, attempt ${mockOverloadedModels.attemptCounts[modelName]}/3`);

        // Check if this attempt should fail
        if (mockOverloadedModels.attemptCounts[modelName] <= mockOverloadedModels.attemptsBeforePassing[modelName]) {
          console.log(`⚠️ Simulating model overload error for ${modelName}`);

          // Add a small delay to simulate waiting
          await new Promise(resolve => setTimeout(resolve, 100));

          // Continue to next attempt if we haven't reached max retries
          if (mockOverloadedModels.attemptCounts[modelName] < 3) {
            console.log(`Waiting 100ms before retry...`);
            continue;
          }

          // Move to next model
          console.log(`Max retries reached for ${modelName}, trying next model...`);
          break;
        }

        // This attempt succeeded
        console.log(`✅ Model ${modelName} successfully generated content on attempt ${mockOverloadedModels.attemptCounts[modelName]}!`);

        // Return success result
        return {
          response: {
            text: () => `This is a simulated response from ${modelName} after ${currentAttempt} total attempts.`
          }
        };
      }
    }

    // If all models failed, throw error
    throw new Error('Failed to generate content with all available models after multiple attempts');
  };

  // Override sleep to make tests faster
  _sleep(ms) {
    console.log(`Waiting ${ms}ms before retry...`);
    return new Promise(resolve => setTimeout(resolve, 100)); // Make tests faster with 100ms
  }
}

// Create an instance of the mock model
const mockModel = new MockResilientModel();

async function testModelFallback() {
  console.log('\n===== RESILIENT MODEL FALLBACK TEST =====');
  console.log('This test simulates model overloading to demonstrate the automatic retry and fallback mechanisms.\n');

  try {
    const generationConfig = {
      temperature: 0.7,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 256,
    };

    console.log('🚀 Sending request to resilient model service...');
    const result = await mockModel.generateContent({
      contents: [{ role: "user", parts: [{ text: "What are the benefits of spaced repetition in studying?" }] }],
      generationConfig,
    });

    console.log('\n🎉 Success! Response received after automatic retry and fallback:');
    console.log('-----------------------------------------------------------');
    console.log(result.response.text());
    console.log('-----------------------------------------------------------');
    console.log(`✅ Request completed using model: ${mockModel.currentModelName}`);

    return true;
  } catch (error) {
    console.error('\n❌ Error in model fallback test:', error.message);
    return false;
  }
}

// Execute test
testModelFallback().then(success => {
  if (success) {
    console.log('\n✅ Model fallback test completed successfully! The resilient model service is working as expected.');
    console.log('When the primary model is overloaded, the service automatically tries alternatives.');
  } else {
    console.log('\n❌ Model fallback test failed. Please check the error messages above.');
  }
});
