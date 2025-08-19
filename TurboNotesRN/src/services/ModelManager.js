import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LlamaContext } from 'llama.rn';

class ModelManager {
  constructor() {
    this.models = [
      {
        id: 'smolvlm2-500m',
        name: 'SmolVLM2-500M-Instruct',
        description: 'Compact vision-language model for text extraction from images',
        size: 350, // MB
        capabilities: ['vision', 'text-extraction', 'ocr', 'image-analysis'],
        downloadUrl: 'https://huggingface.co/HuggingFaceTB/SmolVLM2-500M-Instruct-GGUF/resolve/main/smolvlm2-500m-instruct-q4_k_m.gguf',
        fileName: 'smolvlm2-500m-instruct-q4_k_m.gguf',
        isVision: true,
        contextLength: 8192,
      },
      {
        id: 'gemma-2b',
        name: 'Gemma 2B Instruct',
        description: 'Fast text model for note enhancement and summarization',
        size: 1400, // MB
        capabilities: ['text-generation', 'summarization', 'enhancement', 'categorization'],
        downloadUrl: 'https://huggingface.co/google/gemma-2b-it-GGUF/resolve/main/gemma-2b-it.q4_0.gguf',
        fileName: 'gemma-2b-it.q4_0.gguf',
        isVision: false,
        contextLength: 8192,
      },
      {
        id: 'phi3-mini',
        name: 'Phi-3 Mini',
        description: 'Microsoft\'s efficient model optimized for mobile devices',
        size: 2100, // MB
        capabilities: ['text-generation', 'reasoning', 'coding', 'qa'],
        downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
        fileName: 'Phi-3-mini-4k-instruct-q4.gguf',
        isVision: false,
        contextLength: 4096,
      }
    ];
    
    this.activeModel = null;
    this.activeContext = null;
    this.modelListeners = [];
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    
    this.initializeModelsDirectory();
  }

  async initializeModelsDirectory() {
    try {
      const exists = await RNFS.exists(this.modelsDir);
      if (!exists) {
        await RNFS.mkdir(this.modelsDir);
        console.log('📁 Created models directory:', this.modelsDir);
      }
    } catch (error) {
      console.error('❌ Failed to create models directory:', error);
    }
  }

  async getAvailableModels() {
    const modelsWithStatus = await Promise.all(
      this.models.map(async (model) => {
        const filePath = `${this.modelsDir}/${model.fileName}`;
        const isDownloaded = await RNFS.exists(filePath);
        let downloadedSize = 0;
        
        if (isDownloaded) {
          try {
            const stat = await RNFS.stat(filePath);
            downloadedSize = Math.round(stat.size / 1024 / 1024); // MB
          } catch (error) {
            console.error('Error getting file size:', error);
          }
        }
        
        return {
          ...model,
          isDownloaded,
          downloadedSize,
          filePath,
          isActive: this.activeModel?.id === model.id
        };
      })
    );
    
    return modelsWithStatus;
  }

  async downloadModel(modelId, onProgress) {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const filePath = `${this.modelsDir}/${model.fileName}`;
    
    // Check if already downloaded
    const exists = await RNFS.exists(filePath);
    if (exists) {
      console.log(`✅ Model ${model.name} already downloaded`);
      return filePath;
    }

    console.log(`📥 Starting download: ${model.name}`);
    console.log(`📍 URL: ${model.downloadUrl}`);
    console.log(`💾 Size: ${model.size}MB`);

    try {
      const downloadResult = await RNFS.downloadFile({
        fromUrl: model.downloadUrl,
        toFile: filePath,
        headers: {
          'User-Agent': 'TurboNotes/1.0 (React Native)',
        },
        progressInterval: 1000,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          const downloadedMB = Math.round(res.bytesWritten / 1024 / 1024);
          const totalMB = Math.round(res.contentLength / 1024 / 1024);
          
          if (onProgress) {
            onProgress({
              progress: Math.round(progress),
              downloadedMB,
              totalMB,
              speed: res.bytesWritten / (Date.now() - res.jobId) * 1000 // bytes per second
            });
          }
          
          console.log(`📊 Download progress: ${Math.round(progress)}% (${downloadedMB}/${totalMB}MB)`);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        console.log(`✅ Model ${model.name} downloaded successfully`);
        
        // Verify file size
        const stat = await RNFS.stat(filePath);
        const actualSizeMB = Math.round(stat.size / 1024 / 1024);
        console.log(`📏 Downloaded size: ${actualSizeMB}MB`);
        
        // Save download info
        await AsyncStorage.setItem(`model_${modelId}_downloaded`, JSON.stringify({
          downloadedAt: new Date().toISOString(),
          size: actualSizeMB,
          path: filePath
        }));
        
        return filePath;
      } else {
        throw new Error(`Download failed with status ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error(`❌ Failed to download ${model.name}:`, error);
      
      // Clean up partial download
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
      
      throw error;
    }
  }

  async loadModel(modelId) {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const filePath = `${this.modelsDir}/${model.fileName}`;
    const exists = await RNFS.exists(filePath);
    
    if (!exists) {
      throw new Error(`Model ${model.name} not downloaded. Please download it first.`);
    }

    // Unload current model if any
    if (this.activeContext) {
      console.log('🔄 Unloading current model...');
      await this.activeContext.release();
      this.activeContext = null;
      this.activeModel = null;
    }

    console.log(`🔄 Loading model: ${model.name}`);
    console.log(`📍 Path: ${filePath}`);

    try {
      // Configure model parameters based on device capabilities
      const modelConfig = {
        modelPath: filePath,
        contextSize: Math.min(model.contextLength, 4096), // Limit context for mobile
        batchSize: 512,
        threads: -1, // Use all available threads
        gpuLayers: 0, // Start with CPU, can be increased based on device
        verbose: true,
      };

      // Special configuration for vision models
      if (model.isVision) {
        modelConfig.multimodal = true;
        modelConfig.contextSize = Math.min(model.contextLength, 2048); // Smaller context for vision
      }

      this.activeContext = await LlamaContext.initFromFile(filePath, modelConfig);
      this.activeModel = model;
      
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
      this.activeContext = null;
      this.activeModel = null;
      throw error;
    }
  }

  async unloadModel() {
    if (this.activeContext) {
      console.log(`🔄 Unloading model: ${this.activeModel?.name}`);
      await this.activeContext.release();
      this.activeContext = null;
      this.activeModel = null;
      
      await AsyncStorage.removeItem('active_model');
      console.log('✅ Model unloaded');
      
      // Notify listeners
      this.notifyModelUnloaded();
    }
  }

  async deleteModel(modelId) {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Unload if currently active
    if (this.activeModel?.id === modelId) {
      await this.unloadModel();
    }

    const filePath = `${this.modelsDir}/${model.fileName}`;
    const exists = await RNFS.exists(filePath);
    
    if (exists) {
      await RNFS.unlink(filePath);
      console.log(`🗑️ Deleted model: ${model.name}`);
      
      // Remove download info
      await AsyncStorage.removeItem(`model_${modelId}_downloaded`);
    }
  }

  // Text extraction from images using SmolVLM2
  async extractTextFromImage(imageUri) {
    if (!this.activeModel || !this.activeModel.isVision) {
      throw new Error('No vision model loaded. Please load SmolVLM2-500M-Instruct first.');
    }

    if (!this.activeContext) {
      throw new Error('Model context not available');
    }

    console.log('🔍 Extracting text from image...');
    
    try {
      const prompt = `<|im_start|>system
You are a helpful AI assistant specialized in extracting text from images. Analyze the image and extract all visible text accurately. If there's no text, say "No text found in image".
<|im_end|>
<|im_start|>user
<image>
Please extract all the text you can see in this image. Be accurate and preserve formatting where possible.
<|im_end|>
<|im_start|>assistant`;

      const result = await this.activeContext.completion({
        prompt: prompt,
        image: imageUri,
        n_predict: 512,
        temperature: 0.1, // Low temperature for accuracy
        top_p: 0.9,
        stop: ['<|im_end|>'],
      });

      const extractedText = result.text.trim();
      console.log('✅ Text extraction completed');
      
      return {
        text: extractedText,
        model: this.activeModel.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw error;
    }
  }

  // Enhanced text generation for note enhancement
  async generateText(prompt, options = {}) {
    if (!this.activeContext) {
      throw new Error('No model loaded. Please load a model first.');
    }

    const {
      maxTokens = 512,
      temperature = 0.7,
      topP = 0.9,
      stopWords = [],
    } = options;

    try {
      const result = await this.activeContext.completion({
        prompt: prompt,
        n_predict: maxTokens,
        temperature: temperature,
        top_p: topP,
        stop: stopWords,
      });

      return result.text.trim();
    } catch (error) {
      console.error('❌ Text generation failed:', error);
      throw error;
    }
  }

  // Model event listeners
  addModelListener(listener) {
    this.modelListeners.push(listener);
  }

  removeModelListener(listener) {
    this.modelListeners = this.modelListeners.filter(l => l !== listener);
  }

  notifyModelLoaded(model) {
    this.modelListeners.forEach(listener => {
      if (listener.onModelLoaded) {
        listener.onModelLoaded(model);
      }
    });
  }

  notifyModelUnloaded() {
    this.modelListeners.forEach(listener => {
      if (listener.onModelUnloaded) {
        listener.onModelUnloaded();
      }
    });
  }

  // Utility methods
  getActiveModel() {
    return this.activeModel;
  }

  isModelLoaded() {
    return this.activeContext !== null;
  }

  async getStorageInfo() {
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

  async calculateModelsSize() {
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
}

// Singleton instance
export const modelManager = new ModelManager();
export default modelManager;
