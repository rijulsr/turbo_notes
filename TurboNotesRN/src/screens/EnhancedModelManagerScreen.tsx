/**
 * Enhanced Model Manager Screen
 * Complete UI for model discovery, download, management, and settings
 * with HuggingFace integration and advanced configuration options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  ProgressBar,
  FAB,
  Searchbar,
  Menu,
  Divider,
  Avatar,
  Badge
} from 'react-native-paper';
import { observer } from 'mobx-react';
import { enhancedModelManager, LocalModel, DownloadProgress } from '../services/EnhancedModelManager';
import { huggingFaceService } from '../services/HuggingFaceService';
import ModelSettingsModal from '../components/ModelSettingsModal';

const { width } = Dimensions.get('window');

interface EnhancedModelManagerScreenProps {
  theme: any;
}

const EnhancedModelManagerScreen = observer(({ theme }: EnhancedModelManagerScreenProps) => {
  // State management
  const [models, setModels] = useState<LocalModel[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'downloaded' | 'recommended'>('recommended');
  
  // Modal states
  const [settingsModal, setSettingsModal] = useState<{ visible: boolean; model: LocalModel | null }>({
    visible: false,
    model: null
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // Categories for filtering
  const categories = [
    { key: 'all', label: 'All Models', icon: '🌐' },
    { key: 'Vision', label: 'Vision', icon: '👁️' },
    { key: 'Lightweight', label: 'Lightweight', icon: '⚡' },
    { key: 'Balanced', label: 'Balanced', icon: '⚖️' },
    { key: 'High-Performance', label: 'High-Performance', icon: '🚀' },
    { key: 'Multilingual', label: 'Multilingual', icon: '🌍' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecommendedModels(),
        loadStorageInfo()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedModels = async () => {
    try {
      const recommended = await enhancedModelManager.getRecommendedModels();
      setRecommendedModels(recommended);
    } catch (error) {
      console.error('Failed to load recommended models:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await enhancedModelManager.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const searchModels = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setModels([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await enhancedModelManager.discoverModels({
        search: query,
        limit: 20,
        sort: 'downloads'
      });
      setModels(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', 'Failed to search models. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (model: LocalModel) => {
    try {
      const progressCallback = (progress: DownloadProgress) => {
        setDownloadProgress(prev => new Map(prev.set(model.id, progress)));
      };

      await enhancedModelManager.downloadModel(model.id, progressCallback);
      
      Alert.alert(
        'Download Complete!',
        `${model.name} has been downloaded successfully. You can now load it for AI features.`,
        [{ text: 'OK', onPress: () => loadRecommendedModels() }]
      );

    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Download Failed', error.message);
    }
  };

  const handleLoadModel = async (model: LocalModel) => {
    if (model.isActive) {
      // Unload model
      try {
        await enhancedModelManager.unloadModel();
        Alert.alert('Success', `${model.name} has been unloaded.`);
        loadRecommendedModels();
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
        
        await enhancedModelManager.loadModel(model.id);
        Alert.alert('Success!', `${model.name} is now loaded and ready for AI features!`);
        loadRecommendedModels();
      } catch (error) {
        Alert.alert('Load Failed', error.message);
      }
    }
  };

  const handleDeleteModel = (model: LocalModel) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.name}? This will free up ${model.downloadedSize || model.size}MB of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await enhancedModelManager.deleteModel(model.id);
              Alert.alert('Deleted', `${model.name} has been deleted.`);
              loadRecommendedModels();
              loadStorageInfo();
            } catch (error) {
              Alert.alert('Error', `Failed to delete model: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const openModelSettings = (model: LocalModel) => {
    setSettingsModal({ visible: true, model });
  };

  const renderStorageInfo = () => {
    if (!storageInfo) return null;

    const usedPercentage = (storageInfo.modelsSize / 1024) / storageInfo.freeSpace * 100;

    return (
      <Card style={[styles.storageCard, { backgroundColor: theme.surface }]}>
        <Card.Content>
          <View style={styles.storageHeader}>
            <Text style={[styles.storageTitle, { color: theme.text }]}>
              Storage Usage
            </Text>
            <Text style={[styles.storageSize, { color: theme.primary }]}>
              {storageInfo.modelsSize}MB used
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(usedPercentage / 100, 1)}
            color={usedPercentage > 80 ? theme.error : theme.primary}
            style={styles.storageProgress}
          />
          <Text style={[styles.storageDetails, { color: theme.textSecondary }]}>
            {storageInfo.freeSpace.toFixed(1)}GB free of {storageInfo.totalSpace.toFixed(1)}GB total
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderModelCard = (model: LocalModel, showActions: boolean = true) => {
    const progress = downloadProgress.get(model.id);
    const isDownloading = progress && progress.status === 'downloading';

    return (
      <Card key={model.id} style={[styles.modelCard, { backgroundColor: theme.surface }]}>
        <Card.Content>
          <View style={styles.modelHeader}>
            <View style={styles.modelInfo}>
              <View style={styles.modelTitleRow}>
                <Text style={[styles.modelName, { color: theme.text }]} numberOfLines={1}>
                  {model.name}
                </Text>
                {model.isActive && (
                  <Badge style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                    Active
                  </Badge>
                )}
              </View>
              <Text style={[styles.modelAuthor, { color: theme.textSecondary }]}>
                by {model.author}
              </Text>
              <Text style={[styles.modelDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                {model.description}
              </Text>
            </View>
            <View style={styles.modelMeta}>
              <Text style={[styles.modelSize, { color: theme.primary }]}>
                {model.downloadedSize || model.size}MB
              </Text>
              <Text style={[styles.modelDownloads, { color: theme.textSecondary }]}>
                {model.downloads.toLocaleString()} ↓
              </Text>
            </View>
          </View>

          {/* Model Tags */}
          <View style={styles.modelTags}>
            <Chip
              mode="outlined"
              compact
              style={[styles.categoryChip, { borderColor: theme.primary }]}
              textStyle={{ color: theme.primary, fontSize: 10 }}
            >
              {model.category}
            </Chip>
            <Chip
              mode="outlined"
              compact
              style={[styles.quantChip, { borderColor: theme.border }]}
              textStyle={{ color: theme.textSecondary, fontSize: 10 }}
            >
              {model.quantization}
            </Chip>
            {model.isVision && (
              <Chip
                mode="outlined"
                compact
                style={[styles.visionChip, { borderColor: theme.accent }]}
                textStyle={{ color: theme.accent, fontSize: 10 }}
              >
                Vision
              </Chip>
            )}
          </View>

          {/* Capabilities */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.capabilities}>
            {model.capabilities.slice(0, 4).map((capability, index) => (
              <Chip
                key={index}
                compact
                style={[styles.capabilityChip, { backgroundColor: theme.background }]}
                textStyle={{ color: theme.textSecondary, fontSize: 9 }}
              >
                {capability}
              </Chip>
            ))}
          </ScrollView>

          {/* Download Progress */}
          {isDownloading && progress && (
            <View style={styles.downloadProgress}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressText, { color: theme.text }]}>
                  Downloading... {progress.progress}%
                </Text>
                <Text style={[styles.progressSize, { color: theme.textSecondary }]}>
                  {progress.downloadedMB}/{progress.totalMB}MB
                </Text>
              </View>
              <ProgressBar
                progress={progress.progress / 100}
                color={theme.primary}
                style={styles.progressBar}
              />
              {progress.timeRemaining && (
                <Text style={[styles.timeRemaining, { color: theme.textSecondary }]}>
                  {Math.ceil(progress.timeRemaining / 60)} min remaining
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          {showActions && (
            <View style={styles.modelActions}>
              {!model.isDownloaded ? (
                <Button
                  mode="contained"
                  onPress={() => handleDownload(model)}
                  disabled={isDownloading}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  labelStyle={{ fontSize: 12 }}
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              ) : (
                <>
                  <Button
                    mode={model.isActive ? 'contained' : 'outlined'}
                    onPress={() => handleLoadModel(model)}
                    style={[
                      styles.actionButton,
                      model.isActive && { backgroundColor: theme.error }
                    ]}
                    labelStyle={{ fontSize: 12 }}
                  >
                    {model.isActive ? 'Unload' : 'Load'}
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => openModelSettings(model)}
                    style={styles.actionButton}
                    labelStyle={{ fontSize: 12, color: theme.primary }}
                  >
                    Settings
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => handleDeleteModel(model)}
                    style={styles.actionButton}
                    labelStyle={{ fontSize: 12, color: theme.error }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderRecommendedTab = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStorageInfo()}
        
        {Object.entries(recommendedModels).map(([category, categoryModels]) => {
          if (!Array.isArray(categoryModels) || categoryModels.length === 0) return null;
          
          const categoryInfo = categories.find(c => c.key === category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryTitle, { color: theme.text }]}>
                  {categoryInfo?.icon} {categoryInfo?.label || category}
                </Text>
                <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                  {categoryModels.length} models
                </Text>
              </View>
              
              {categoryModels.map((model: LocalModel) => renderModelCard(model))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderBrowseTab = () => {
    return (
      <View style={styles.content}>
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search HuggingFace models..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={() => searchModels()}
            style={[styles.searchBar, { backgroundColor: theme.surface }]}
            inputStyle={{ color: theme.text }}
            placeholderTextColor={theme.textSecondary}
          />
          
          {/* Filter Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {categories.map((category) => (
              <Chip
                key={category.key}
                mode={selectedCategory === category.key ? 'flat' : 'outlined'}
                selected={selectedCategory === category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[
                  styles.filterChip,
                  selectedCategory === category.key && { backgroundColor: theme.primary }
                ]}
                textStyle={{
                  color: selectedCategory === category.key ? 'white' : theme.text,
                  fontSize: 12
                }}
              >
                {category.icon} {category.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
          {models.length > 0 ? (
            models
              .filter(model => selectedCategory === 'all' || model.category === selectedCategory)
              .map(model => renderModelCard(model))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'No models found. Try a different search term.' : 'Search for models to get started.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderDownloadedTab = () => {
    const downloadedModels = Object.values(recommendedModels)
      .flat()
      .filter((model: LocalModel) => model.isDownloaded);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStorageInfo()}
        
        {downloadedModels.length > 0 ? (
          downloadedModels.map((model: LocalModel) => renderModelCard(model))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No models downloaded yet. Browse recommended models to get started.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          AI Model Manager
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Text style={[styles.menuIcon, { color: theme.text }]}>⋮</Text>
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            loadRecommendedModels();
          }} title="Refresh Models" />
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            huggingFaceService.clearCache();
            Alert.alert('Cache Cleared', 'Model cache has been cleared.');
          }} title="Clear Cache" />
        </Menu>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        {[
          { key: 'recommended', label: 'Recommended', icon: '⭐' },
          { key: 'browse', label: 'Browse', icon: '🔍' },
          { key: 'downloaded', label: 'Downloaded', icon: '💾' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
              { backgroundColor: activeTab === tab.key ? theme.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? 'white' : theme.text }
            ]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'recommended' && renderRecommendedTab()}
      {activeTab === 'browse' && renderBrowseTab()}
      {activeTab === 'downloaded' && renderDownloadedTab()}

      {/* Model Settings Modal */}
      <ModelSettingsModal
        visible={settingsModal.visible}
        model={settingsModal.model}
        onClose={() => setSettingsModal({ visible: false, model: null })}
        theme={theme}
      />

      {/* Refresh FAB */}
      <FAB
        icon="refresh"
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          if (activeTab === 'recommended') {
            loadRecommendedModels();
          } else if (activeTab === 'browse' && searchQuery) {
            searchModels();
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuIcon: {
    fontSize: 24,
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTab: {
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  storageCard: {
    marginBottom: 16,
    elevation: 2,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  storageSize: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  storageProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  storageDetails: {
    fontSize: 11,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryCount: {
    fontSize: 12,
  },
  modelCard: {
    marginBottom: 12,
    elevation: 2,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  activeBadge: {
    marginLeft: 8,
  },
  modelAuthor: {
    fontSize: 12,
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  modelMeta: {
    alignItems: 'flex-end',
  },
  modelSize: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modelDownloads: {
    fontSize: 10,
  },
  modelTags: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  categoryChip: {
    height: 24,
  },
  quantChip: {
    height: 24,
  },
  visionChip: {
    height: 24,
  },
  capabilities: {
    marginBottom: 12,
  },
  capabilityChip: {
    height: 20,
    marginRight: 4,
  },
  downloadProgress: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSize: {
    fontSize: 10,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  timeRemaining: {
    fontSize: 10,
    textAlign: 'center',
  },
  modelActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    height: 32,
  },
  searchResults: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default EnhancedModelManagerScreen;
