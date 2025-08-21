/**
 * Legacy ModelManager Bridge
 * Provides backward compatibility while transitioning to EnhancedModelManager
 */

import { enhancedModelManager } from './EnhancedModelManager';

class ModelManager {
  constructor() {
    // Bridge to enhanced model manager
    this.enhancedManager = enhancedModelManager;
    
    // Legacy model definitions for backward compatibility
    this.models = [
      // Vision Models - Best for image analysis and OCR
      {
        id: 'smolvlm2-500m',
        name: 'SmolVLM2-500M-Instruct',
        description: '🔥 RECOMMENDED: Compact vision-language model for text extraction from images',
        size: 350, // MB
        capabilities: ['vision', 'text-extraction', 'ocr', 'image-analysis'],
        downloadUrl: 'https://huggingface.co/bartowski/SmolVLM2-500M-Instruct-GGUF/resolve/main/SmolVLM2-500M-Instruct-Q4_K_M.gguf',
        fileName: 'SmolVLM2-500M-Instruct-Q4_K_M.gguf',
        isVision: true,
        contextLength: 8192,
        category: 'Vision',
      },
      {
        id: 'llava-phi3-mini',
        name: 'LLaVA-Phi3-Mini',
        description: 'Advanced vision model with better image understanding and reasoning',
        size: 2200, // MB
        capabilities: ['vision', 'image-analysis', 'visual-qa', 'scene-description'],
        downloadUrl: 'https://huggingface.co/bartowski/llava-phi-3-mini-gguf/resolve/main/llava-phi-3-mini-Q4_K_M.gguf',
        fileName: 'llava-phi-3-mini-Q4_K_M.gguf',
        isVision: true,
        contextLength: 4096,
        category: 'Vision',
      },
      
      // Fast & Lightweight Models - Best for quick responses
      {
        id: 'tinyllama-1b',
        name: 'TinyLlama 1.1B',
        description: '⚡ FASTEST: Ultra-lightweight model for instant responses and basic tasks',
        size: 650, // MB
        capabilities: ['text-generation', 'basic-qa', 'simple-tasks', 'fast-response'],
        downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.q4_k_m.gguf',
        fileName: 'tinyllama-1.1b-chat-v1.0.q4_k_m.gguf',
        isVision: false,
        contextLength: 2048,
        category: 'Lightweight',
      },
      {
        id: 'qwen2-1.5b',
        name: 'Qwen2 1.5B Instruct',
        description: 'Efficient multilingual model with excellent performance-to-size ratio',
        size: 900, // MB
        capabilities: ['text-generation', 'multilingual', 'summarization', 'translation'],
        downloadUrl: 'https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf',
        fileName: 'qwen2-1_5b-instruct-q4_k_m.gguf',
        isVision: false,
        contextLength: 32768,
        category: 'Lightweight',
      },
      
      // Balanced Models - Good performance and size
      {
        id: 'gemma-2b',
        name: 'Gemma 2B Instruct',
        description: 'Google\'s balanced model for note enhancement and summarization',
        size: 1400, // MB
        capabilities: ['text-generation', 'summarization', 'enhancement', 'categorization'],
        downloadUrl: 'https://huggingface.co/bartowski/gemma-2b-it-GGUF/resolve/main/gemma-2b-it-Q4_K_M.gguf',
        fileName: 'gemma-2b-it-Q4_K_M.gguf',
        isVision: false,
        contextLength: 8192,
        category: 'Balanced',
      },
      {
        id: 'phi3-mini',
        name: 'Phi-3 Mini 3.8B',
        description: 'Microsoft\'s efficient model optimized for mobile devices',
        size: 2100, // MB
        capabilities: ['text-generation', 'reasoning', 'coding', 'qa'],
        downloadUrl: 'https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf',
        fileName: 'Phi-3-mini-4k-instruct-Q4_K_M.gguf',
        isVision: false,
        contextLength: 4096,
        category: 'Balanced',
      },
      {
        id: 'llama3.2-3b',
        name: 'Llama 3.2 3B Instruct',
        description: 'Meta\'s latest compact model with excellent instruction following',
        size: 1800, // MB
        capabilities: ['text-generation', 'instruction-following', 'creative-writing', 'analysis'],
        downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
        fileName: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
        isVision: false,
        contextLength: 131072,
        category: 'Balanced',
      },
      
      // Specialized Models
      {
        id: 'codeqwen-1.5b',
        name: 'CodeQwen 1.5B',
        description: '💻 CODE SPECIALIST: Optimized for programming, debugging, and code explanation',
        size: 950, // MB
        capabilities: ['coding', 'debugging', 'code-explanation', 'programming-help'],
        downloadUrl: 'https://huggingface.co/bartowski/CodeQwen1.5-7B-Chat-GGUF/resolve/main/CodeQwen1.5-7B-Chat-Q4_K_M.gguf',
        fileName: 'CodeQwen1.5-7B-Chat-Q4_K_M.gguf',
        isVision: false,
        contextLength: 65536,
        category: 'Specialized',
      },
      {
        id: 'mistral-7b',
        name: 'Mistral 7B Instruct',
        description: '🎯 HIGH QUALITY: Excellent for creative writing, analysis, and complex tasks',
        size: 4100, // MB
        capabilities: ['creative-writing', 'analysis', 'reasoning', 'complex-tasks'],
        downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.q4_k_m.gguf',
        fileName: 'mistral-7b-instruct-v0.2.q4_k_m.gguf',
        isVision: false,
        contextLength: 32768,
        category: 'High-Performance',
      },
      {
        id: 'openchat-3.5',
        name: 'OpenChat 3.5 7B',
        description: 'Conversational AI model excellent for dialogue and Q&A',
        size: 4000, // MB
        capabilities: ['conversation', 'qa', 'dialogue', 'chat'],
        downloadUrl: 'https://huggingface.co/TheBloke/openchat-3.5-0106-GGUF/resolve/main/openchat-3.5-0106.q4_k_m.gguf',
        fileName: 'openchat-3.5-0106.q4_k_m.gguf',
        isVision: false,
        contextLength: 8192,
        category: 'Conversational',
      },
      
      // Multilingual Models
      {
        id: 'aya-23-8b',
        name: 'Aya 23 8B',
        description: '🌍 MULTILINGUAL: Supports 23+ languages for global note-taking',
        size: 4500, // MB
        capabilities: ['multilingual', 'translation', 'cross-language', 'global-support'],
        downloadUrl: 'https://huggingface.co/bartowski/aya-23-8B-GGUF/resolve/main/aya-23-8B-Q4_K_M.gguf',
        fileName: 'aya-23-8B-Q4_K_M.gguf',
        isVision: false,
        contextLength: 8192,
        category: 'Multilingual',
      }
    ];
    
    this.activeModel = null;
    this.activeContext = null;
    this.modelListeners = [];
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    this.llamaInitialized = false;
    
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

  // Bridge methods to enhanced model manager
  async getAvailableModels() {
    try {
      const recommended = await this.enhancedManager.getRecommendedModels();
      const allModels = Object.values(recommended).flat();
      
      // Convert to legacy format for backward compatibility
      return allModels.map(model => ({
        ...model,
        isActive: model.isActive || false
      }));
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  async downloadModel(modelId, onProgress) {
    try {
      // Bridge to enhanced model manager
      const progressCallback = (progress) => {
        if (onProgress) {
          onProgress({
            progress: progress.progress,
            downloadedMB: progress.downloadedMB,
            totalMB: progress.totalMB,
            speed: progress.speed
          });
        }
      };

      const filePath = await this.enhancedManager.downloadModel(modelId, progressCallback);
      return filePath;
    } catch (error) {
      console.error(`❌ Download failed for ${modelId}:`, error);
      throw error;
    }
  }

  async loadModel(modelId) {
    try {
      // Bridge to enhanced model manager
      const context = await this.enhancedManager.loadModel(modelId);
      
      // Update legacy references for backward compatibility
      this.activeContext = context;
      this.activeModel = this.enhancedManager.getActiveModel();
      
      return context;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelId}:`, error);
      throw error;
    }
  }

  async unloadModel() {
    try {
      // Bridge to enhanced model manager
      await this.enhancedManager.unloadModel();
      
      // Clear legacy references
      this.activeContext = null;
      this.activeModel = null;
      
      console.log('✅ Model unloaded');
    } catch (error) {
      console.error('❌ Failed to unload model:', error);
      throw error;
    }
  }

  async deleteModel(modelId) {
    try {
      // Bridge to enhanced model manager
      await this.enhancedManager.deleteModel(modelId);
      console.log(`🗑️ Deleted model: ${modelId}`);
    } catch (error) {
      console.error(`❌ Failed to delete model ${modelId}:`, error);
      throw error;
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

      const result = await this.activeContext.completion(prompt, {
        image: imageUri,
        n_predict: 512,
        temperature: 0.1, // Low temperature for accuracy
        top_p: 0.9,
        stop: ['<|im_end|>'],
      });

      const extractedText = result.trim();
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
    try {
      // Bridge to enhanced model manager
      return await this.enhancedManager.generateText(prompt, options);
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

  // Utility methods - bridge to enhanced model manager
  getActiveModel() {
    return this.enhancedManager.getActiveModel();
  }

  isModelLoaded() {
    return this.enhancedManager.isModelLoaded();
  }

  async getStorageInfo() {
    try {
      return await this.enhancedManager.getStorageInfo();
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
