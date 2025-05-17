# Setting Up Google Gemini API 2.0

> **🎉 New Features**: The Make-it app now integrates with Google Gemini 2.0 to provide AI-generated study resources, notes, and flashcards! We've also added resilient model handling to prevent service disruptions.

To use the AI-powered resource generation features in this app, you'll need a Google Gemini API key. Follow these steps to set it up:

## Step 1: Get a Google Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Go to the "API keys" section
4. Create a new API key with access to Gemini 2.0 models (gemini-2.0-flash)
5. Copy the API key to your clipboard

## Step 2: Add Your API Key to the App

1. Open the file at `app/config/apiKeys.js`
2. Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual API key
3. Save the file

## Step 3: Test Your API Integration

Run the test script to verify your API key is working correctly:

```bash
npm run test-gemini
```

Additionally, you can test the new resilient model service (with automatic retries and fallbacks) by running:

```bash
npm run test-resilient
```

If successful, you'll see example output from the API. If you encounter any errors, check your API key and ensure you have access to Gemini 2.0 Flash model.

## Step 4: Understanding the Resilient Model Service

The app now includes a resilient model service that provides:

- **Automatic retries**: If the API returns a 503 error (model overloaded), the service will automatically retry the request after a short delay.
- **Model fallbacks**: If the primary model (gemini-2.0-flash) is unavailable, the service will automatically try alternative models:
  1. First fallback: gemini-1.5-flash
  2. Last resort: gemini-pro

This ensures that your study resource generation works reliably even during high-demand periods.

## Step 5: Restart the App

Restart the application to apply the changes.

## Using AI-Generated Study Resources

Once configured:

1. Go to the "Study Resources" screen
2. Tap the sparkle icon (✨) in the top right
3. Enter a study topic
4. The AI will generate helpful study resources and images
5. You can save these as notes or convert them to flashcards

## Important Notes

- Keep your API key private and never commit it to public repositories
- The Gemini API may have usage limits based on your account
- AI-generated content should be verified for accuracy in educational contexts
