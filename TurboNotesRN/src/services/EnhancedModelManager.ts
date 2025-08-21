/**
 * Enhanced Model Manager
 * Complete model management system with HuggingFace integration,
 * reliable downloads, and proper llama.rn API usage.
 */

import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initLlama, LlamaContext } from 'llama.rn';
import { makeObservable, observable, action, computed } from 'mobx';
import { huggingFaceService, ProcessedModel } from './HuggingFaceService';

export interface LocalModel extends ProcessedModel {
  isDownloaded: boolean;
  isLoaded: boolean;
  isActive: boolean;
  downloadedSize?: number;
  filePath: string;
  downloadedAt?: string;
  lastUsed?: string;
}

export interface DownloadProgress {
  progress: number;
  downloadedMB: number;
  totalMB: number;
  speed?: number;
  timeRemaining?: number;
  status: 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface ModelSettings {
  chatTemplate?: string;
  systemPrompt?: string;
  completionParams: {
    temperature: number;
    top_p: number;
    top_k: number;
    min_p: number;
    typical_p: number;
    penalty_repeat: number;
    penalty_freq: number;
    penalty_present: number;
    mirostat: number;
    mirostat_tau: number;
    mirostat_eta: number;
    n_predict: number;
    stop_sequences: string[];
  };
  contextParams: {
    n_ctx: number;
    n_batch: number;
    n_threads: number;
    n_gpu_layers: number;
    use_mlock: boolean;
    flash_attn: boolean;
  };
}

export interface ChatTemplate {
  name: string;
  template: string;
  systemPrompt?: string;
  addBosToken?: boolean;
  addEosToken?: boolean;
  bosToken?: string;
  eosToken?: string;
}

class EnhancedModelManager {
  // Observable state
  @observable models: LocalModel[] = [];
  @observable activeModel: LocalModel | null = null;
  @observable activeContext: LlamaContext | null = null;
  @observable downloadProgress: Map<string, DownloadProgress> = new Map();
  @observable isInitialized = false;
  @observable llamaInitialized = false;
  @observable modelSettings: Map<string, ModelSettings> = new Map();

  // Configuration
  private modelsDir: string;
  private settingsDir: string;
  private modelListeners: Array<{
    onModelLoaded?: (model: LocalModel) => void;
    onModelUnloaded?: () => void;
    onDownloadProgress?: (modelId: string, progress: DownloadProgress) => void;
  }> = [];

  // Built-in chat templates
  private chatTemplates: ChatTemplate[] = [
    {
      name: 'ChatML',
      template: '<|im_start|>system\n{system_message}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n',
      systemPrompt: 'You are a helpful AI assistant.',
      addBosToken: false,
      addEosToken: false,
      bosToken: '<|im_start|>',
      eosToken: '<|im_end|>'
    },
    {
      name: 'Llama-3',
      template: '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
      systemPrompt: 'You are a helpful AI assistant.',
      addBosToken: true,
      addEosToken: false,
      bosToken: '<|begin_of_text|>',
      eosToken: '<|eot_id|>'
    },
    {
      name: 'Gemma',
      template: '<bos><start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n',
      systemPrompt: '',
      addBosToken: true,
      addEosToken: false,
      bosToken: '<bos>',
      eosToken: '<end_of_turn>'
    },
    {
      name: 'Phi-3',
      template: '<|system|>\n{system_message}<|end|>\n<|user|>\n{prompt}<|end|>\n<|assistant|>\n',
      systemPrompt: 'You are a helpful AI assistant.',
      addBosToken: false,
      addEosToken: false,
      bosToken: '<|system|>',
      eosToken: '<|end|>'
    }
  ];

  constructor() {
    makeObservable(this);
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    this.settingsDir = `${RNFS.DocumentDirectoryPath}/model_settings`;
    this.initialize();
  }

  @action
  private async initialize() {
    try {
      // Create directories
      await this.createDirectories();
      
      // Load existing models
      await this.loadLocalModels();
      
      // Load model settings
      await this.loadModelSettings();
      
      // Restore active model if any
      await this.restoreActiveModel();
      
      this.isInitialized = true;
      console.log('🚀 Enhanced Model Manager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Model Manager:', error);
    }
  }

  @computed
  get isReady(): boolean {
    return this.isInitialized && this.llamaInitialized;
  }

  @computed
  get downloadingModels(): LocalModel[] {
    return this.models.filter(model => this.downloadProgress.has(model.id));
  }

  @computed
  get availableModels(): LocalModel[] {
    return this.models.filter(model => model.isDownloaded);
  }

  /**
   * Search and discover models from HuggingFace
   */
  async discoverModels(searchParams = {}): Promise<LocalModel[]> {
    try {
      const discoveredModels = await huggingFaceService.searchModels(searchParams);
      
      // Convert to LocalModel format and check local status
      const localModels = await Promise.all(
        discoveredModels.map(async (model) => {
          const filePath = `${this.modelsDir}/${model.fileName}`;
          const isDownloaded = await RNFS.exists(filePath);
          let downloadedSize = 0;
          
          if (isDownloaded) {
            try {
              const stat = await RNFS.stat(filePath);
              downloadedSize = Math.round(stat.size / 1024 / 1024);
            } catch (error) {
              console.error('Error getting file size:', error);
            }
          }
          
          return {
            ...model,
            isDownloaded,
            isLoaded: false,
            isActive: this.activeModel?.id === model.id,
            downloadedSize,
            filePath
          } as LocalModel;
        })
      );

      return localModels;
      
    } catch (error) {
      console.error('❌ Failed to discover models:', error);
      return [];
    }
  }

  /**
   * Get recommended models by category
   */
  async getRecommendedModels(): Promise<{
    vision: LocalModel[];
    lightweight: LocalModel[];
    balanced: LocalModel[];
    specialized: LocalModel[];
    multilingual: LocalModel[];
  }> {
    try {
      const recommended = await huggingFaceService.getRecommendedModels();
      const result: any = {};
      
      for (const [category, models] of Object.entries(recommended)) {
        result[category] = await Promise.all(
          models.map(async (model: ProcessedModel) => {
            const filePath = `${this.modelsDir}/${model.fileName}`;
            const isDownloaded = await RNFS.exists(filePath);
            
            return {
              ...model,
              isDownloaded,
              isLoaded: false,
              isActive: this.activeModel?.id === model.id,
              filePath
            } as LocalModel;
          })
        );
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to get recommended models:', error);
      return {
        vision: [],
        lightweight: [],
        balanced: [],
        specialized: [],
        multilingual: []
      };
    }
  }

  /**
   * Download a model with progress tracking and error recovery
   */
  @action
  async downloadModel(
    modelId: string, 
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    let model = this.models.find(m => m.id === modelId);
    
    // If model not in local list, try to get it from HuggingFace
    if (!model) {
      const hfModel = await huggingFaceService.getModelDetails(modelId);
      if (!hfModel) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      model = {
        ...hfModel,
        isDownloaded: false,
        isLoaded: false,
        isActive: false,
        filePath: `${this.modelsDir}/${hfModel.fileName}`
      } as LocalModel;
      
      this.models.push(model);
    }

    const filePath = model.filePath;
    
    // Check if already downloaded
    const exists = await RNFS.exists(filePath);
    if (exists) {
      console.log(`✅ Model ${model.name} already downloaded`);
      model.isDownloaded = true;
      return filePath;
    }

    // Initialize download progress
    const initialProgress: DownloadProgress = {
      progress: 0,
      downloadedMB: 0,
      totalMB: model.size,
      status: 'downloading'
    };
    
    this.downloadProgress.set(modelId, initialProgress);

    console.log(`📥 Starting download: ${model.name}`);
    console.log(`📍 URL: ${model.downloadUrl}`);
    console.log(`💾 Size: ${model.size}MB`);

    try {
      // Validate download URL first
      const validation = await huggingFaceService.validateDownloadUrl(
        model.id, 
        model.fileName
      );

      const downloadUrl = validation.isValid ? validation.url : model.downloadUrl;
      
      if (!validation.isValid) {
        console.warn(`⚠️ Using potentially invalid URL for ${model.name}`);
      }

      const startTime = Date.now();
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: filePath,
        headers: {
          'User-Agent': 'TurboNotes/1.0 (React Native)',
          'Accept': '*/*',
          'Accept-Encoding': 'identity'
        },
        progressInterval: 1000,
        progress: (res) => {
          const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
          const downloadedMB = Math.round(res.bytesWritten / 1024 / 1024);
          const totalMB = Math.round(res.contentLength / 1024 / 1024);
          
          // Calculate speed and time remaining
          const elapsedTime = Date.now() - startTime;
          const speed = res.bytesWritten / (elapsedTime / 1000); // bytes per second
          const remainingBytes = res.contentLength - res.bytesWritten;
          const timeRemaining = remainingBytes / speed; // seconds
          
          const progressData: DownloadProgress = {
            progress,
            downloadedMB,
            totalMB,
            speed,
            timeRemaining,
            status: 'downloading'
          };
          
          this.downloadProgress.set(modelId, progressData);
          onProgress?.(progressData);
          
          console.log(`📊 Download progress: ${progress}% (${downloadedMB}/${totalMB}MB)`);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log(`✅ Model ${model.name} downloaded successfully`);
        
        // Verify file size
        const stat = await RNFS.stat(filePath);
        const actualSizeMB = Math.round(stat.size / 1024 / 1024);
        console.log(`📏 Downloaded size: ${actualSizeMB}MB`);
        
        // Update model status
        model.isDownloaded = true;
        model.downloadedSize = actualSizeMB;
        model.downloadedAt = new Date().toISOString();
        
        // Save download info
        await AsyncStorage.setItem(`model_${modelId}_downloaded`, JSON.stringify({
          downloadedAt: model.downloadedAt,
          size: actualSizeMB,
          path: filePath
        }));
        
        // Complete download progress
        const completedProgress: DownloadProgress = {
          progress: 100,
          downloadedMB: actualSizeMB,
          totalMB: actualSizeMB,
          status: 'completed'
        };
        
        this.downloadProgress.set(modelId, completedProgress);
        onProgress?.(completedProgress);
        
        // Remove from progress after a delay
        setTimeout(() => {
          this.downloadProgress.delete(modelId);
        }, 3000);
        
        return filePath;
        
      } else {
        let errorMessage = `Download failed with HTTP status ${downloadResult.statusCode}`;
        
        switch (downloadResult.statusCode) {
          case 401:
            errorMessage = 'Download failed: Access denied (401). The model may require authentication or the URL may be incorrect.';
            break;
          case 403:
            errorMessage = 'Download failed: Access forbidden (403). You may need special permissions to download this model.';
            break;
          case 404:
            errorMessage = 'Download failed: Model not found (404). The file may have been moved or deleted.';
            break;
          case 429:
            errorMessage = 'Download failed: Too many requests (429). Please wait before trying again.';
            break;
          case 500:
            errorMessage = 'Download failed: Server error (500). Please try again later.';
            break;
        }
        
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error(`❌ Failed to download ${model.name}:`, error);
      
      // Update progress with error
      const errorProgress: DownloadProgress = {
        progress: 0,
        downloadedMB: 0,
        totalMB: model.size,
        status: 'error',
        error: error.message
      };
      
      this.downloadProgress.set(modelId, errorProgress);
      onProgress?.(errorProgress);
      
      // Clean up partial download
      try {
        const exists = await RNFS.exists(filePath);
        if (exists) {
          await RNFS.unlink(filePath);
        }
      } catch (cleanupError) {
        console.error('❌ Failed to clean up partial download:', cleanupError);
      }
      
      // Remove error progress after delay
      setTimeout(() => {
        this.downloadProgress.delete(modelId);
      }, 10000);
      
      throw error;
    }
  }

  /**
   * Load a model with proper llama.rn API usage
   */
  @action
  async loadModel(modelId: string): Promise<LlamaContext> {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isDownloaded) {
      throw new Error(`Model ${model.name} not downloaded. Please download it first.`);
    }

    // Unload current model if any
    if (this.activeContext) {
      console.log('🔄 Unloading current model...');
      await this.unloadModel();
    }

    console.log(`🔄 Loading model: ${model.name}`);
    console.log(`📍 Path: ${model.filePath}`);

    try {
      // Initialize llama.rn if not already done
      if (!this.llamaInitialized) {
        await initLlama();
        this.llamaInitialized = true;
        console.log('🚀 Llama.rn initialized successfully');
      }

      // Get model settings or use defaults
      const settings = this.getModelSettings(modelId);
      
      // Configure model parameters
      const modelConfig = {
        model: model.filePath,
        ...settings.contextParams,
        verbose_prompt: false,
        use_mmap: true,
      };

      // Special configuration for vision models
      if (model.isVision) {
        modelConfig.n_ctx = Math.min(modelConfig.n_ctx, 2048);
        modelConfig.n_gpu_layers = 0; // Vision models often work better on CPU
      }

      // Load the model using correct API
      this.activeContext = await LlamaContext.init(modelConfig);
      this.activeModel = model;
      
      // Update model status
      model.isLoaded = true;
      model.isActive = true;
      model.lastUsed = new Date().toISOString();
      
      console.log(`✅ Model ${model.name} loaded successfully`);
      
      // Save active model info
      await AsyncStorage.setItem('active_model', JSON.stringify({
        id: model.id,
        loadedAt: new Date().toISOString()
      }));
      
      // Notify listeners
      this.notifyModelLoaded(model);
      
      return this.activeContext;
      
    } catch (error) {
      console.error(`❌ Failed to load model ${model.name}:`, error);
      
      // Reset state on failure
      this.activeContext = null;
      this.activeModel = null;
      if (model) {
        model.isLoaded = false;
        model.isActive = false;
      }
      
      throw error;
    }
  }

  /**
   * Unload the current model
   */
  @action
  async unloadModel(): Promise<void> {
    if (this.activeContext) {
      console.log(`🔄 Unloading model: ${this.activeModel?.name}`);
      
      try {
        await this.activeContext.release();
      } catch (error) {
        console.error('❌ Error releasing context:', error);
      }
      
      this.activeContext = null;
      
      if (this.activeModel) {
        this.activeModel.isLoaded = false;
        this.activeModel.isActive = false;
        this.activeModel = null;
      }
      
      await AsyncStorage.removeItem('active_model');
      console.log('✅ Model unloaded');
      
      // Notify listeners
      this.notifyModelUnloaded();
    }
  }

  /**
   * Delete a model from storage
   */
  @action
  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Unload if currently active
    if (this.activeModel?.id === modelId) {
      await this.unloadModel();
    }

    const exists = await RNFS.exists(model.filePath);
    if (exists) {
      await RNFS.unlink(model.filePath);
      console.log(`🗑️ Deleted model: ${model.name}`);
    }
    
    // Update model status
    model.isDownloaded = false;
    model.downloadedSize = undefined;
    model.downloadedAt = undefined;
    
    // Remove download info
    await AsyncStorage.removeItem(`model_${modelId}_downloaded`);
    
    // Remove model settings
    await this.deleteModelSettings(modelId);
  }

  /**
   * Generate text using the active model
   */
  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      stopWords?: string[];
      stream?: boolean;
      onToken?: (token: string) => void;
    } = {}
  ): Promise<string> {
    if (!this.activeContext || !this.activeModel) {
      throw new Error('No model loaded. Please load a model first.');
    }

    // Get model settings
    const settings = this.getModelSettings(this.activeModel.id);
    
    // Merge options with settings
    const {
      maxTokens = settings.completionParams.n_predict,
      temperature = settings.completionParams.temperature,
      topP = settings.completionParams.top_p,
      topK = settings.completionParams.top_k,
      stopWords = settings.completionParams.stop_sequences,
      stream = false,
      onToken
    } = options;

    // Format prompt using chat template if available
    const formattedPrompt = this.formatPrompt(prompt);

    try {
      const completionParams = {
        prompt: formattedPrompt,
        n_predict: maxTokens,
        temperature,
        top_p: topP,
        top_k: topK,
        stop: stopWords,
        ...settings.completionParams
      };

      if (stream && onToken) {
        // Streaming generation
        let fullResponse = '';
        
        const completion = this.activeContext.completion(completionParams);
        
        for await (const token of completion) {
          if (token.token) {
            fullResponse += token.token;
            onToken(token.token);
          }
        }
        
        return fullResponse.trim();
      } else {
        // Non-streaming generation
        const result = await this.activeContext.completion(completionParams);
        return result.text?.trim() || '';
      }

    } catch (error) {
      console.error('❌ Text generation failed:', error);
      throw error;
    }
  }

  /**
   * Get or create model settings
   */
  getModelSettings(modelId: string): ModelSettings {
    if (!this.modelSettings.has(modelId)) {
      // Create default settings
      const defaultSettings: ModelSettings = {
        completionParams: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          min_p: 0.05,
          typical_p: 1.0,
          penalty_repeat: 1.1,
          penalty_freq: 0.0,
          penalty_present: 0.0,
          mirostat: 0,
          mirostat_tau: 5.0,
          mirostat_eta: 0.1,
          n_predict: 512,
          stop_sequences: []
        },
        contextParams: {
          n_ctx: 4096,
          n_batch: 512,
          n_threads: -1,
          n_gpu_layers: 0,
          use_mlock: false,
          flash_attn: false
        }
      };
      
      this.modelSettings.set(modelId, defaultSettings);
    }
    
    return this.modelSettings.get(modelId)!;
  }

  /**
   * Update model settings
   */
  @action
  async updateModelSettings(modelId: string, settings: Partial<ModelSettings>): Promise<void> {
    const currentSettings = this.getModelSettings(modelId);
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      completionParams: {
        ...currentSettings.completionParams,
        ...settings.completionParams
      },
      contextParams: {
        ...currentSettings.contextParams,
        ...settings.contextParams
      }
    };
    
    this.modelSettings.set(modelId, updatedSettings);
    
    // Save to storage
    await this.saveModelSettings(modelId, updatedSettings);
  }

  /**
   * Get available chat templates
   */
  getChatTemplates(): ChatTemplate[] {
    return this.chatTemplates;
  }

  /**
   * Format prompt using chat template
   */
  private formatPrompt(prompt: string): string {
    if (!this.activeModel) return prompt;
    
    const settings = this.getModelSettings(this.activeModel.id);
    
    if (settings.chatTemplate) {
      const template = this.chatTemplates.find(t => t.name === settings.chatTemplate);
      if (template) {
        return template.template
          .replace('{system_message}', settings.systemPrompt || template.systemPrompt || '')
          .replace('{prompt}', prompt);
      }
    }
    
    return prompt;
  }

  // Private helper methods...
  
  private async createDirectories(): Promise<void> {
    const dirs = [this.modelsDir, this.settingsDir];
    
    for (const dir of dirs) {
      const exists = await RNFS.exists(dir);
      if (!exists) {
        await RNFS.mkdir(dir);
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  private async loadLocalModels(): Promise<void> {
    // This would load any existing models from storage
    // For now, we'll start with an empty list and populate from HuggingFace
    this.models = [];
  }

  private async loadModelSettings(): Promise<void> {
    try {
      const files = await RNFS.readDir(this.settingsDir);
      
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          const modelId = file.name.replace('.json', '');
          const settingsPath = `${this.settingsDir}/${file.name}`;
          const settingsJson = await RNFS.readFile(settingsPath, 'utf8');
          const settings = JSON.parse(settingsJson);
          
          this.modelSettings.set(modelId, settings);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load model settings:', error);
    }
  }

  private async saveModelSettings(modelId: string, settings: ModelSettings): Promise<void> {
    try {
      const settingsPath = `${this.settingsDir}/${modelId}.json`;
      await RNFS.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (error) {
      console.error(`❌ Failed to save settings for ${modelId}:`, error);
    }
  }

  private async deleteModelSettings(modelId: string): Promise<void> {
    try {
      const settingsPath = `${this.settingsDir}/${modelId}.json`;
      const exists = await RNFS.exists(settingsPath);
      if (exists) {
        await RNFS.unlink(settingsPath);
      }
      this.modelSettings.delete(modelId);
    } catch (error) {
      console.error(`❌ Failed to delete settings for ${modelId}:`, error);
    }
  }

  private async restoreActiveModel(): Promise<void> {
    try {
      const activeModelJson = await AsyncStorage.getItem('active_model');
      if (activeModelJson) {
        const activeModelInfo = JSON.parse(activeModelJson);
        // We don't auto-load the model, just mark it as the last active one
        console.log(`📋 Last active model: ${activeModelInfo.id}`);
      }
    } catch (error) {
      console.error('❌ Failed to restore active model:', error);
    }
  }

  // Event handling
  addModelListener(listener: any): void {
    this.modelListeners.push(listener);
  }

  removeModelListener(listener: any): void {
    this.modelListeners = this.modelListeners.filter(l => l !== listener);
  }

  private notifyModelLoaded(model: LocalModel): void {
    this.modelListeners.forEach(listener => {
      if (listener.onModelLoaded) {
        listener.onModelLoaded(model);
      }
    });
  }

  private notifyModelUnloaded(): void {
    this.modelListeners.forEach(listener => {
      if (listener.onModelUnloaded) {
        listener.onModelUnloaded();
      }
    });
  }

  // Utility methods
  async getStorageInfo(): Promise<{
    totalSpace: number;
    freeSpace: number;
    modelsSize: number;
  } | null> {
    try {
      const fsInfo = await RNFS.getFSInfo();
      const modelsSize = await this.calculateModelsSize();
      
      return {
        totalSpace: Math.round(fsInfo.totalSpace / 1024 / 1024 / 1024 * 100) / 100, // GB
        freeSpace: Math.round(fsInfo.freeSpace / 1024 / 1024 / 1024 * 100) / 100, // GB
        modelsSize: Math.round(modelsSize / 1024 / 1024), // MB
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  private async calculateModelsSize(): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await RNFS.readDir(this.modelsDir);
      
      for (const file of files) {
        if (file.name.endsWith('.gguf')) {
          totalSize += file.size;
        }
      }
    } catch (error) {
      console.error('Error calculating models size:', error);
    }
    
    return totalSize;
  }

  // Getters
  getActiveModel(): LocalModel | null {
    return this.activeModel;
  }

  isModelLoaded(): boolean {
    return this.activeContext !== null;
  }

  getAllModels(): LocalModel[] {
    return this.models;
  }
}

// Singleton instance
export const enhancedModelManager = new EnhancedModelManager();
export default enhancedModelManager;
