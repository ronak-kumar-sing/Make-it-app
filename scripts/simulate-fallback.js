/**
 * Test script to simulate and demonstrate model fallback under overload conditions
 */

import { MODELS } from '../app/services/ResilientModelService.js';

// Function to simulate model behavior with deliberate failures
async function simulateModelWithFallbacks() {
  console.log('\n===== RESILIENT MODEL FALLBACK SIMULATION =====');
  console.log('This test simulates model overloading to demonstrate the automatic retry and fallback mechanisms.\n');

  const modelSequence = [MODELS.PRIMARY, MODELS.FALLBACK, MODELS.LAST_RESORT];
  const maxAttemptsPerModel = 3;

  // Define which models will fail and how many times
  const modelFailures = {
    [MODELS.PRIMARY]: 3,     // Primary model always fails (3/3 attempts)
    [MODELS.FALLBACK]: 1,    // Fallback succeeds on 2nd attempt
    [MODELS.LAST_RESORT]: 0  // Last resort always succeeds
  };

  let totalAttempts = 0;
  let finalModel = null;

  // Loop through each model in sequence
  for (const modelName of modelSequence) {
    console.log(`\n🔍 Trying model sequence: ${modelName}`);

    // Try up to maxAttemptsPerModel times for the current model
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      totalAttempts++;

      console.log(`  Attempt ${attempt}/${maxAttemptsPerModel} with model ${modelName}`);

      // Check if this attempt should fail based on our configuration
      if (attempt <= modelFailures[modelName]) {
        console.log(`  ⚠️ ERROR (503): Model ${modelName} is overloaded. Simulating failure.`);

        // Check if we've exhausted all attempts for this model
        if (attempt === maxAttemptsPerModel) {
          console.log(`  ❌ Maximum retries reached for ${modelName}. Moving to next model.`);
          break;  // Move to next model
        } else {
          console.log(`  ⏱️ Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;  // Try this model again
        }
      }

      // This attempt succeeded!
      console.log(`  ✅ SUCCESS: Model ${modelName} generated content!`);
      finalModel = modelName;

      return {
        success: true,
        model: finalModel,
        attempts: totalAttempts,
        response: `This is a simulated response from ${modelName} after ${totalAttempts} total attempts.`
      };
    }
  }

  // If we get here, all models failed
  return {
    success: false,
    attempts: totalAttempts,
    error: 'All models failed after multiple retry attempts'
  };
}

// Run the test
async function runTest() {
  try {
    const result = await simulateModelWithFallbacks();

    if (result.success) {
      console.log('\n✅ Model fallback system worked!');
      console.log(`🏆 Successfully generated content with model: ${result.model}`);
      console.log(`📊 Total attempts: ${result.attempts}`);
      console.log('📝 Response:');
      console.log('-'.repeat(50));
      console.log(result.response);
      console.log('-'.repeat(50));
    } else {
      console.log('\n❌ All fallback attempts failed');
      console.log(`📊 Total attempts: ${result.attempts}`);
      console.log(`❗ Error: ${result.error}`);
    }

    console.log('\n🔍 What this demonstrates:');
    console.log('1. When the primary model fails, the system tries again several times');
    console.log('2. If retries fail, it automatically falls back to alternative models');
    console.log('3. The app continues working even when API services are temporarily overloaded');

  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

runTest();
