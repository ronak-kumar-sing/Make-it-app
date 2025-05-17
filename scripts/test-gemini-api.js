import { generateFlashcards, generateStudyImage, generateStudyResources } from '../app/services/GeminiService.js';

/**
 * A simple test script to validate the Gemini API integration
 */
async function testGeminiAPI() {
  try {
    console.log('🧪 Testing Gemini API connection...');

    // Test a simple resource generation
    console.log('Generating a study resource for "photosynthesis"...');
    const resources = await generateStudyResources('photosynthesis', 1);
    console.log('✅ Resource generation successful!');
    console.log(JSON.stringify(resources, null, 2));

    console.log('\n---------------------------------------\n');

    // Test image description generation
    console.log('Generating image description for "black holes"...');
    const imageResult = await generateStudyImage('black holes');
    console.log('✅ Image description generation successful!');
    console.log(typeof imageResult === 'string' ? imageResult : JSON.stringify(imageResult, null, 2));

    console.log('\n---------------------------------------\n');

    // Test flashcard generation
    console.log('Generating flashcards for "basic algebra"...');
    const flashcards = await generateFlashcards('basic algebra', 2);
    console.log('✅ Flashcard generation successful!');
    console.log(JSON.stringify(flashcards, null, 2));

    console.log('\n✅ All tests passed! Your Gemini API integration is working correctly.');
    console.log('You can now use the AI Resource Generator in the app.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your API key in app/config/apiKeys.js');
    console.error('2. Your internet connection');
    console.error('3. That you have access to the Gemini 1.5 models');
    console.error('\nSee GEMINI_SETUP.md for more instructions.');
  }
}

// Run the test
testGeminiAPI();
