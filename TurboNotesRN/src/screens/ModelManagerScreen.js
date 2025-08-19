import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  useColorScheme,
} from 'react-native';
import modelManager from '../services/ModelManager';

const ModelManagerScreen = () => {
  const [models, setModels] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [downloadModal, setDownloadModal] = useState({ visible: false, model: null });
  const isDarkMode = useColorScheme() === 'dark';

  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  useEffect(() => {
    loadModels();
    loadStorageInfo();
    
    // Add model listener
    const listener = {
      onModelLoaded: (model) => {
        console.log('Model loaded:', model.name);
        loadModels();
      },
      onModelUnloaded: () => {
        console.log('Model unloaded');
        loadModels();
      }
    };
    
    modelManager.addModelListener(listener);
    
    return () => {
      modelManager.removeModelListener(listener);
    };
  }, []);

  const loadModels = async () => {
    try {
      const availableModels = await modelManager.getAvailableModels();
      setModels(availableModels);
    } catch (error) {
      console.error('Failed to load models:', error);
      Alert.alert('Error', 'Failed to load models');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await modelManager.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleDownload = async (model) => {
    setDownloadModal({ visible: false, model: null });
    
    try {
      setDownloadProgress(prev => ({
        ...prev,
        [model.id]: { progress: 0, downloadedMB: 0, totalMB: model.size }
      }));

      const filePath = await modelManager.downloadModel(model.id, (progress) => {
        setDownloadProgress(prev => ({
          ...prev,
          [model.id]: progress
        }));
      });

      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[model.id];
        return newProgress;
      });

      Alert.alert(
        'Download Complete!',
        `${model.name} has been downloaded successfully. You can now load it for AI features.`,
        [{ text: 'OK', onPress: loadModels }]
      );

    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Failed', error.message);
      
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[model.id];
        return newProgress;
      });
    }
  };

  const handleLoadModel = async (model) => {
    if (model.isActive) {
      // Unload model
      try {
        await modelManager.unloadModel();
        Alert.alert('Success', `${model.name} has been unloaded.`);
        loadModels();
      } catch (error) {
        Alert.alert('Error', `Failed to unload model: ${error.message}`);
      }
    } else {
      // Load model
      try {
        Alert.alert(
          'Loading Model',
          `Loading ${model.name}... This may take a few moments.`,
          [{ text: 'OK' }]
        );
        
        await modelManager.loadModel(model.id);
        Alert.alert('Success!', `${model.name} is now loaded and ready for AI features!`);
        loadModels();
      } catch (error) {
        Alert.alert('Load Failed', error.message);
      }
    }
  };

  const handleDeleteModel = (model) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.name}? This will free up ${model.downloadedSize}MB of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await modelManager.deleteModel(model.id);
              Alert.alert('Deleted', `${model.name} has been deleted.`);
              loadModels();
              loadStorageInfo();
            } catch (error) {
              Alert.alert('Error', `Failed to delete model: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const confirmDownload = (model) => {
    setDownloadModal({ visible: true, model });
  };

  const renderModel = (model) => {
    const progress = downloadProgress[model.id];
    const isDownloading = !!progress;

    return (
      <View key={model.id} style={[styles.modelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Model Header */}
        <View style={styles.modelHeader}>
          <View style={styles.modelInfo}>
            <Text style={[styles.modelName, { color: theme.text }]}>
              {model.name}
            </Text>
            <Text style={[styles.modelDescription, { color: theme.textSecondary }]}>
              {model.description}
            </Text>
          </View>
          
          {model.isActive && (
            <View style={[styles.activeBadge, { backgroundColor: theme.success }]}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Model Details */}
        <View style={styles.modelDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Size:</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {model.isDownloaded ? `${model.downloadedSize}MB` : `${model.size}MB`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type:</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {model.isVision ? '🔍 Vision + Text' : '📝 Text Only'}
            </Text>
          </View>
        </View>

        {/* Capabilities */}
        <View style={styles.capabilities}>
          {model.capabilities.map((capability, index) => (
            <View key={index} style={[styles.capabilityChip, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
              <Text style={[styles.capabilityText, { color: theme.primary }]}>
                {capability}
              </Text>
            </View>
          ))}
        </View>

        {/* Download Progress */}
        {isDownloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress.progress}%`, 
                    backgroundColor: theme.primary 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {progress.progress}% - {progress.downloadedMB}/{progress.totalMB}MB
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!model.isDownloaded ? (
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: theme.primary }]}
              onPress={() => confirmDownload(model)}
              disabled={isDownloading}
            >
              <Text style={styles.buttonText}>
                {isDownloading ? 'Downloading...' : '📥 Download'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.loadButton, 
                  { backgroundColor: model.isActive ? theme.warning : theme.success }
                ]}
                onPress={() => handleLoadModel(model)}
              >
                <Text style={styles.buttonText}>
                  {model.isActive ? '⏹️ Unload' : '🚀 Load'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error }]}
                onPress={() => handleDeleteModel(model)}
              >
                <Text style={styles.buttonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          🤖 AI Models
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Download and manage local AI models
        </Text>
        
        {/* Storage Info */}
        {storageInfo && (
          <View style={styles.storageInfo}>
            <Text style={[styles.storageText, { color: theme.textSecondary }]}>
              💾 Storage: {storageInfo.freeSpace}GB free / {storageInfo.totalSpace}GB total
            </Text>
            {storageInfo.modelsSize > 0 && (
              <Text style={[styles.storageText, { color: theme.textSecondary }]}>
                🤖 Models: {storageInfo.modelsSize}MB used
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Models List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadModels();
            loadStorageInfo();
          }} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading models...
            </Text>
          </View>
        ) : (
          <View style={styles.modelsList}>
            {models.map(renderModel)}
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            🎯 Recommended: SmolVLM2-500M-Instruct
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • Extract text from images and photos
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • Analyze screenshots and documents
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • OCR capabilities for note-taking
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • Compact size optimized for mobile
          </Text>
        </View>
      </ScrollView>

      {/* Download Confirmation Modal */}
      <Modal
        visible={downloadModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDownloadModal({ visible: false, model: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Download Model
            </Text>
            
            {downloadModal.model && (
              <>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  {downloadModal.model.name}
                </Text>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  Size: {downloadModal.model.size}MB
                </Text>
                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  This will download the model to your device for local AI processing.
                </Text>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => setDownloadModal({ visible: false, model: null })}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => downloadModal.model && handleDownload(downloadModal.model)}
              >
                <Text style={styles.modalButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  storageInfo: {
    marginTop: 8,
  },
  storageText: {
    fontSize: 14,
    marginBottom: 2,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  modelsList: {
    padding: 16,
  },
  modelCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modelDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
  },
  capabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  capabilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  capabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ModelManagerScreen;
