// Test script for the resilient model service
import { MODELS, resilientModel } from '../app/services/ResilientModelService.js';

console.log('Testing the Resilient Model Service...');
console.log(`Current model: ${resilientModel.currentModelName}`);
console.log('Available models:', MODELS);

async function testModelWithRetry() {
  console.log('\n--- Testing content generation with retry logic ---');

  try {
    const generationConfig = {
      temperature: 0.7,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 256,
    };

    const result = await resilientModel.generateContent({
      contents: [{ role: "user", parts: [{ text: "What are the benefits of spaced repetition in studying?" }] }],
      generationConfig,
    });

    console.log('\nSuccess! Response:');
    console.log('-------------------');
    console.log(result.response.text().substring(0, 200) + '...');
    console.log('-------------------');
    console.log(`Model used: ${resilientModel.currentModelName}`);

    return true;
  } catch (error) {
    console.error('\nError testing resilient model:', error.message);
    return false;
  }
}

// Execute test
testModelWithRetry().then(success => {
  if (success) {
    console.log('\n✅ Resilient model test completed successfully');
  } else {
    console.log('\n❌ Resilient model test failed');
  }
});
