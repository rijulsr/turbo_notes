import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { observer } from 'mobx-react';
import { improvedAIService } from '../services/ImprovedAIService';

interface VisionNoteEditorProps {
  onSave: (content: string, imageUri?: string) => void;
  onCancel: () => void;
  initialContent?: string;
  initialImageUri?: string;
}

const VisionNoteEditor = observer(({
  onSave,
  onCancel,
  initialContent = '',
  initialImageUri
}: VisionNoteEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [imageUri, setImageUri] = useState<string | undefined>(initialImageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setImageUri(asset.uri);
        setAnalysisResult(''); // Clear previous analysis
      }
    });
  };

  const handleAnalyzeImage = async (analysisType: 'describe' | 'ocr' | 'note') => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    if (!improvedAIService.getActiveModel()?.isVision) {
      Alert.alert(
        'Vision Model Required', 
        'Please download and load SmolVLM2 to analyze images.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    setIsAnalyzing(true);
    
    try {
      let result = '';
      
      switch (analysisType) {
        case 'describe':
          result = await improvedAIService.describeImageForNote(imageUri);
          break;
        case 'ocr':
          result = await improvedAIService.extractTextFromImage(imageUri);
          break;
        case 'note':
          result = await improvedAIService.createVisualNote(imageUri);
          break;
      }
      
      setAnalysisResult(result);
      
      // Auto-append to content if it's a note creation
      if (analysisType === 'note') {
        const separator = content.trim() ? '\n\n---\n\n' : '';
        setContent(content + separator + result);
      }
      
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      Alert.alert('Analysis Error', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Empty Note', 'Please add some content or an image.');
      return;
    }
    
    onSave(content, imageUri);
  };

  const isVisionModelActive = improvedAIService.getActiveModel()?.isVision;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Vision Note Editor</Text>
        <Text style={styles.subtitle}>
          {isVisionModelActive 
            ? '🔥 SmolVLM2 Active - Vision features enabled' 
            : '⚠️ Load SmolVLM2 for vision features'
          }
        </Text>
      </View>

      {/* Image Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📷 Image</Text>
          <TouchableOpacity style={styles.selectButton} onPress={handleImagePicker}>
            <Text style={styles.selectButtonText}>
              {imageUri ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            
            {/* Vision Analysis Buttons */}
            {isVisionModelActive && (
              <View style={styles.visionButtons}>
                <TouchableOpacity
                  style={[styles.visionButton, styles.describeButton]}
                  onPress={() => handleAnalyzeImage('describe')}
                  disabled={isAnalyzing}
                >
                  <Text style={styles.visionButtonText}>🔍 Describe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visionButton, styles.ocrButton]}
                  onPress={() => handleAnalyzeImage('ocr')}
                  disabled={isAnalyzing}
                >
                  <Text style={styles.visionButtonText}>📄 Extract Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visionButton, styles.noteButton]}
                  onPress={() => handleAnalyzeImage('note')}
                  disabled={isAnalyzing}
                >
                  <Text style={styles.visionButtonText}>📝 Create Note</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Analysis Results */}
      {analysisResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisText}>{analysisResult}</Text>
            <TouchableOpacity
              style={styles.appendButton}
              onPress={() => {
                const separator = content.trim() ? '\n\n' : '';
                setContent(content + separator + analysisResult);
                setAnalysisResult('');
              }}
            >
              <Text style={styles.appendButtonText}>📎 Append to Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Text Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Note Content</Text>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Write your note here... You can also analyze images above to auto-generate content."
          placeholderTextColor="#666"
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Note</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing image with SmolVLM2...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  visionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  visionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  describeButton: {
    backgroundColor: '#6366f1',
  },
  ocrButton: {
    backgroundColor: '#8b5cf6',
  },
  noteButton: {
    backgroundColor: '#06b6d4',
  },
  visionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  analysisContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  appendButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  appendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
    backgroundColor: '#fafafa',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VisionNoteEditor;

