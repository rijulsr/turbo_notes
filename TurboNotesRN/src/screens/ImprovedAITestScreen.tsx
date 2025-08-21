import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react';
import { improvedAIService, DownloadProgress } from '../services/ImprovedAIService';

const ImprovedAITestScreen = observer(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: DownloadProgress}>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDownloadModel = async (modelId: string) => {
    const model = improvedAIService.getModelInfo(modelId);
    if (!model) return;

    if (model.isDownloaded) {
      Alert.alert('Already Downloaded', `${model.name} is already downloaded.`);
      return;
    }

    setIsLoading(true);
    addTestResult(`Starting download of ${model.name}...`);

    try {
      await improvedAIService.downloadModel(modelId, (progress) => {
        setDownloadProgress(prev => ({
          ...prev,
          [modelId]: progress
        }));

        if (progress.status === 'completed') {
          addTestResult(`✅ ${model.name} downloaded successfully!`);
          setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[modelId];
            return newProgress;
          });
        } else if (progress.status === 'error') {
          addTestResult(`❌ Download failed: ${progress.error}`);
        }
      });
    } catch (error) {
      addTestResult(`❌ Download error: ${error.message}`);
      Alert.alert('Download Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadModel = async (modelId: string) => {
    const model = improvedAIService.getModelInfo(modelId);
    if (!model) return;

    if (!model.isDownloaded) {
      Alert.alert('Not Downloaded', 'Please download the model first.');
      return;
    }

    setIsLoading(true);
    addTestResult(`Loading ${model.name}...`);

    try {
      const success = await improvedAIService.loadModel(modelId);
      if (success) {
        addTestResult(`✅ ${model.name} loaded successfully!`);
      } else {
        addTestResult(`❌ Failed to load ${model.name}`);
      }
    } catch (error) {
      addTestResult(`❌ Load error: ${error.message}`);
      Alert.alert('Load Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestGeneration = async () => {
    if (!improvedAIService.isReady) {
      Alert.alert('No Model', 'Please load a model first.');
      return;
    }

    setIsLoading(true);
    addTestResult('Testing text generation...');

    try {
      const prompt = "Write a brief summary about the importance of taking notes.";
      const response = await improvedAIService.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.7
      });

      addTestResult(`🤖 Generated: "${response}"`);
    } catch (error) {
      addTestResult(`❌ Generation error: ${error.message}`);
      Alert.alert('Generation Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNoteFunctions = async () => {
    if (!improvedAIService.isReady) {
      Alert.alert('No Model', 'Please load a model first.');
      return;
    }

    setIsLoading(true);
    const testNote = "Today I had a productive meeting with the development team. We discussed the new features for the mobile app, including AI integration and improved user interface. The project timeline was updated and we're on track for the Q1 release.";

    try {
      addTestResult('Testing note summarization...');
      const summary = await improvedAIService.summarizeNote(testNote);
      addTestResult(`📄 Summary: "${summary}"`);

      addTestResult('Testing note categorization...');
      const category = await improvedAIService.categorizeNote(testNote);
      addTestResult(`🏷️  Category: "${category}"`);

      addTestResult('Testing note enhancement...');
      const enhanced = await improvedAIService.enhanceNote("Quick note: Buy groceries");
      addTestResult(`✨ Enhanced: "${enhanced}"`);

    } catch (error) {
      addTestResult(`❌ Note function error: ${error.message}`);
      Alert.alert('Test Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestVisionFeatures = async () => {
    if (!improvedAIService.getActiveModel()?.isVision) {
      Alert.alert('No Vision Model', 'Please load SmolVLM2 first.');
      return;
    }

    Alert.alert(
      'Vision Feature Test',
      'Vision features require image input. For now, this demonstrates the API is ready. In a full implementation, you would:\n\n1. Select an image\n2. Use analyzeImage() method\n3. Get OCR or description results\n\nThe VisionNoteEditor component provides a complete UI for this.',
      [
        { text: 'OK', style: 'default' }
      ]
    );

    addTestResult('👁️ Vision model loaded and ready for image analysis');
    addTestResult('📝 Use VisionNoteEditor component for full vision features');
  };

  const handleDeleteModel = async (modelId: string) => {
    const model = improvedAIService.getModelInfo(modelId);
    if (!model) return;

    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.name}? This will free up ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await improvedAIService.deleteModel(modelId);
            if (success) {
              addTestResult(`🗑️  Deleted ${model.name}`);
            } else {
              addTestResult(`❌ Failed to delete ${model.name}`);
            }
          }
        }
      ]
    );
  };

  const renderModelCard = (model: any) => {
    const progress = downloadProgress[model.id];
    
    return (
      <View key={model.id} style={[
        styles.modelCard,
        model.isVision && styles.visionModelCard
      ]}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelName}>
            {model.isVision ? '👁️ ' : ''}{model.name}
          </Text>
          <Text style={styles.modelSize}>
            {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
          </Text>
        </View>
        
        <Text style={styles.modelDescription}>{model.description}</Text>
        
        {model.isVision && (
          <View style={styles.visionCapabilities}>
            <Text style={styles.capabilitiesTitle}>Vision Capabilities:</Text>
            <View style={styles.capabilitiesList}>
              {model.capabilities.map((cap: string, index: number) => (
                <Text key={index} style={styles.capabilityTag}>
                  {cap}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.modelStatus}>
          <Text style={styles.statusText}>
            Downloaded: {model.isDownloaded ? '✅' : '❌'} | 
            Loaded: {model.isLoaded ? '✅' : '❌'}
            {model.isVision ? ' | 👁️ Vision Model' : ''}
          </Text>
        </View>

        {progress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {progress.status === 'downloading' 
                ? `Downloading: ${progress.progress}% (${progress.downloadedMB}/${progress.totalMB}MB)`
                : progress.status === 'error'
                ? `Error: ${progress.error}`
                : 'Completed'
              }
            </Text>
            {progress.status === 'downloading' && (
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${progress.progress}%` }]} 
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.downloadButton]}
            onPress={() => handleDownloadModel(model.id)}
            disabled={isLoading || model.isDownloaded}
          >
            <Text style={styles.buttonText}>
              {model.isDownloaded ? 'Downloaded' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.loadButton]}
            onPress={() => handleLoadModel(model.id)}
            disabled={isLoading || !model.isDownloaded}
          >
            <Text style={styles.buttonText}>
              {model.isLoaded ? 'Loaded' : 'Load'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteModel(model.id)}
            disabled={isLoading || !model.isDownloaded}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🤖 Improved AI Service Test</Text>
      
      {/* Models Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Models</Text>
        {improvedAIService.getAllModels().map(renderModelCard)}
      </View>

      {/* Test Functions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Functions</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.primaryButton]}
          onPress={handleTestGeneration}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>Test Text Generation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.secondaryButton]}
          onPress={handleTestNoteFunctions}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>Test Note Functions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.warningButton]}
          onPress={() => improvedAIService.unloadModel()}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>Unload Current Model</Text>
        </TouchableOpacity>

        {improvedAIService.getActiveModel()?.isVision && (
          <TouchableOpacity
            style={[styles.testButton, styles.visionButton]}
            onPress={handleTestVisionFeatures}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>👁️ Test Vision Features</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Status: {improvedAIService.isReady ? '✅ Ready' : '❌ Not Ready'}
        </Text>
        <Text style={styles.statusDetail}>
          Current Model: {improvedAIService.getActiveModel()?.name || 'None'}
        </Text>
      </View>

      {/* Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setTestResults([])}
        >
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
        
        <View style={styles.resultsContainer}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modelCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  modelSize: {
    fontSize: 14,
    color: '#666',
  },
  modelDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modelStatus: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
  },
  loadButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  visionButton: {
    backgroundColor: '#8b5cf6',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visionModelCard: {
    borderColor: '#8b5cf6',
    borderWidth: 2,
    backgroundColor: '#faf5ff',
  },
  visionCapabilities: {
    marginVertical: 8,
  },
  capabilitiesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  capabilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  capabilityTag: {
    fontSize: 10,
    backgroundColor: '#8b5cf6',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resultsContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 4,
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  clearButton: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    marginBottom: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 16,
  },
});

export default ImprovedAITestScreen;
