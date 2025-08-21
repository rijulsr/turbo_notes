/**
 * Test script for the improved AI service
 * Run this to test model downloading and loading functionality
 */

const { improvedAIService } = require('./src/services/ImprovedAIService');

async function testAIService() {
  console.log('🧪 Testing Improved AI Service...\n');

  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📋 Available models:');
    const models = improvedAIService.getAllModels();
    models.forEach(model => {
      console.log(`  • ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB) - Downloaded: ${model.isDownloaded ? '✅' : '❌'}`);
    });
    console.log('');

    // Test downloading the smallest model (Gemma 2B)
    const testModel = models.find(m => m.id === 'gemma-2b-it');
    if (testModel && !testModel.isDownloaded) {
      console.log(`📥 Testing download of ${testModel.name}...`);
      
      try {
        await improvedAIService.downloadModel(testModel.id, (progress) => {
          if (progress.progress % 10 === 0) { // Log every 10%
            console.log(`  Progress: ${progress.progress}% (${progress.downloadedMB}/${progress.totalMB}MB)`);
          }
        });
        console.log(`✅ Download completed successfully!\n`);
      } catch (error) {
        console.error(`❌ Download failed: ${error.message}\n`);
        return;
      }
    } else if (testModel?.isDownloaded) {
      console.log(`✅ ${testModel.name} already downloaded\n`);
    }

    // Test loading the model
    if (testModel?.isDownloaded) {
      console.log(`🔄 Testing model loading...`);
      
      try {
        const loadSuccess = await improvedAIService.loadModel(testModel.id);
        if (loadSuccess) {
          console.log(`✅ Model loaded successfully!\n`);
          
          // Test text generation
          console.log(`🤖 Testing text generation...`);
          const testPrompt = "Write a short summary about the benefits of note-taking.";
          
          try {
            const response = await improvedAIService.generateText(testPrompt, {
              maxTokens: 100,
              temperature: 0.7
            });
            
            console.log(`📝 Generated response:`);
            console.log(`"${response}"\n`);
            
            // Test note-specific functions
            console.log(`📋 Testing note summarization...`);
            const testNote = "Today I had a meeting with the marketing team about the new product launch. We discussed the timeline, budget allocation, and target demographics. The launch is scheduled for next quarter and we need to finalize the advertising campaign by the end of this month.";
            
            const summary = await improvedAIService.summarizeNote(testNote);
            console.log(`📄 Summary: "${summary}"\n`);
            
            console.log(`🏷️  Testing note categorization...`);
            const category = await improvedAIService.categorizeNote(testNote);
            console.log(`📂 Category: "${category}"\n`);
            
            console.log(`✅ All tests passed! AI service is working correctly.`);
            
          } catch (genError) {
            console.error(`❌ Text generation failed: ${genError.message}`);
          }
          
        } else {
          console.error(`❌ Model loading failed`);
        }
      } catch (loadError) {
        console.error(`❌ Model loading error: ${loadError.message}`);
      }
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testAIService().catch(console.error);

