/**
 * Improved AI Service with proper HuggingFace integration and llama.rn API usage
 */

import { LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeObservable, observable, action, computed } from 'mobx';
import { Alert } from 'react-native';
import { 
  initializeLlama, 
  createLlamaContext, 
  releaseLlamaContext,
  checkLlamaAvailability,
  getRecommendedModelConfig 
} from '../utils/llamaSetup';

export interface AIModel {
  id: string;
  name: string;
  size: number; // in bytes
  path: string;
  isDownloaded: boolean;
  isLoaded: boolean;
  description: string;
  capabilities: string[];
  downloadUrl: string;
  fileName: string;
  contextLength: number;
  quantization: string;
  isVision?: boolean;
  supportedFormats?: string[];
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

class ImprovedAIService {
  @observable isInitialized = false;
  @observable llamaInitialized = false;
  @observable currentModel: AIModel | null = null;
  @observable availableModels: AIModel[] = [];
  @observable llamaContext: LlamaContext | null = null;
  @observable isModelLoading = false;
  @observable loadingProgress = 0;
  @observable downloadProgress: Map<string, DownloadProgress> = new Map();

  private modelsDir: string;

  constructor() {
    makeObservable(this);
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    this.initializeService();
  }

  @action
  private async initializeService() {
    try {
      // Create models directory
      if (!(await RNFS.exists(this.modelsDir))) {
        await RNFS.mkdir(this.modelsDir);
      }

      // Initialize available models with latest working URLs
      this.availableModels = [
        {
          id: 'smolvlm2-500m',
          name: 'SmolVLM2-500M-Instruct',
          size: 1.1 * 1024 * 1024 * 1024, // 1.1GB
          path: `${this.modelsDir}/SmolVLM2-500M-Instruct-Q4_K_M.gguf`,
          fileName: 'SmolVLM2-500M-Instruct-Q4_K_M.gguf',
          downloadUrl: 'https://huggingface.co/bartowski/SmolVLM2-500M-Instruct-GGUF/resolve/main/SmolVLM2-500M-Instruct-Q4_K_M.gguf',
          isDownloaded: false,
          isLoaded: false,
          description: '🔥 Vision-Language model for image analysis, OCR, and visual note-taking',
          capabilities: ['vision', 'image-analysis', 'ocr', 'text-extraction', 'visual-qa', 'image-description'],
          contextLength: 8192,
          quantization: 'Q4_K_M',
          isVision: true,
          supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'bmp']
        },
        {
          id: 'gemma-2b-it',
          name: 'Gemma 2.2B Instruct',
          size: 1.6 * 1024 * 1024 * 1024, // 1.6GB
          path: `${this.modelsDir}/gemma-2-2b-it-Q4_K_M.gguf`,
          fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
          downloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
          isDownloaded: false,
          isLoaded: false,
          description: 'Fast, efficient model for note enhancement and summarization',
          capabilities: ['text-generation', 'summarization', 'enhancement', 'categorization'],
          contextLength: 8192,
          quantization: 'Q4_K_M'
        },
        {
          id: 'phi3-mini',
          name: 'Phi-3.5 Mini Instruct',
          size: 2.3 * 1024 * 1024 * 1024, // 2.3GB
          path: `${this.modelsDir}/Phi-3.5-mini-instruct-Q4_K_M.gguf`,
          fileName: 'Phi-3.5-mini-instruct-Q4_K_M.gguf',
          downloadUrl: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
          isDownloaded: false,
          isLoaded: false,
          description: 'Compact model optimized for mobile devices with excellent performance',
          capabilities: ['text-generation', 'summarization', 'qa', 'reasoning'],
          contextLength: 131072,
          quantization: 'Q4_K_M'
        },
        {
          id: 'llama3-8b-instruct',
          name: 'Llama 3.1 8B Instruct',
          size: 4.9 * 1024 * 1024 * 1024, // 4.9GB
          path: `${this.modelsDir}/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`,
          fileName: 'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
          downloadUrl: 'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
          isDownloaded: false,
          isLoaded: false,
          description: 'Powerful model for complex reasoning and detailed analysis',
          capabilities: ['text-generation', 'reasoning', 'analysis', 'coding'],
          contextLength: 131072,
          quantization: 'Q4_K_M'
        }
      ];

      // Check which models are already downloaded
      await this.checkDownloadedModels();
      
      this.isInitialized = true;
      console.log('🤖 Improved AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Improved AI Service:', error);
    }
  }

  @action
  private async checkDownloadedModels() {
    for (const model of this.availableModels) {
      try {
        const exists = await RNFS.exists(model.path);
        model.isDownloaded = exists;
        
        if (exists) {
          const stat = await RNFS.stat(model.path);
          console.log(`📦 Model ${model.name} found: ${(stat.size / 1024 / 1024).toFixed(0)}MB`);
        }
      } catch (error) {
        console.error(`Error checking model ${model.name}:`, error);
      }
    }
  }

  @computed
  get availableLocalModels() {
    return this.availableModels.filter(model => model.isDownloaded);
  }

  @computed
  get isReady() {
    return this.isInitialized && this.llamaInitialized && this.currentModel?.isLoaded;
  }

  @action
  async downloadModel(modelId: string, onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isDownloaded) {
      console.log(`✅ Model ${model.name} already downloaded`);
      return true;
    }

    // Initialize download progress
    const initialProgress: DownloadProgress = {
      progress: 0,
      downloadedMB: 0,
      totalMB: Math.round(model.size / 1024 / 1024),
      status: 'downloading'
    };
    
    this.downloadProgress.set(modelId, initialProgress);
    onProgress?.(initialProgress);

    console.log(`📥 Starting download: ${model.name}`);
    console.log(`📍 URL: ${model.downloadUrl}`);
    console.log(`💾 Size: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB`);

    try {
      const startTime = Date.now();
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: model.downloadUrl,
        toFile: model.path,
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
        const stat = await RNFS.stat(model.path);
        const actualSizeMB = Math.round(stat.size / 1024 / 1024);
        console.log(`📏 Downloaded size: ${actualSizeMB}MB`);
        
        model.isDownloaded = true;
        
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
        
        return true;
        
      } else {
        let errorMessage = `Download failed with HTTP status ${downloadResult.statusCode}`;
        
        switch (downloadResult.statusCode) {
          case 401:
            errorMessage = 'Download failed: Access denied (401). The model may require authentication.';
            break;
          case 403:
            errorMessage = 'Download failed: Access forbidden (403). You may need special permissions.';
            break;
          case 404:
            errorMessage = 'Download failed: Model not found (404). The file may have been moved.';
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
        totalMB: Math.round(model.size / 1024 / 1024),
        status: 'error',
        error: error.message
      };
      
      this.downloadProgress.set(modelId, errorProgress);
      onProgress?.(errorProgress);
      
      // Clean up partial download
      try {
        const exists = await RNFS.exists(model.path);
        if (exists) {
          await RNFS.unlink(model.path);
        }
      } catch (cleanupError) {
        console.error('❌ Failed to clean up partial download:', cleanupError);
      }
      
      throw error;
    }
  }

  @action
  async loadModel(modelId: string): Promise<boolean> {
    try {
      const model = this.availableModels.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      if (!model.isDownloaded) {
        throw new Error(`Model ${model.name} is not downloaded. Please download it first.`);
      }

      // Unload current model if any
      if (this.llamaContext) {
        console.log('🔄 Unloading current model...');
        await this.unloadModel();
      }

      this.isModelLoading = true;
      this.loadingProgress = 0;

      console.log(`🔄 Loading model: ${model.name}`);
      console.log(`📍 Model path: ${model.path}`);

      // Check if file exists
      const exists = await RNFS.exists(model.path);
      if (!exists) {
        throw new Error(`Model file not found at ${model.path}`);
      }

      // Initialize llama.rn if not already done
      if (!this.llamaInitialized) {
        this.llamaInitialized = await initializeLlama();
        if (!this.llamaInitialized) {
          throw new Error('Failed to initialize llama.rn');
        }
      }

      // Get recommended configuration based on model size
      const modelSizeCategory = model.size < 3 * 1024 * 1024 * 1024 ? 'small' : 
                              model.size < 6 * 1024 * 1024 * 1024 ? 'medium' : 'large';
      
      const baseConfig = getRecommendedModelConfig(modelSizeCategory);
      
      // Configure model parameters
      const modelConfig = {
        ...baseConfig,
        model: model.path,
        n_ctx: Math.min(model.contextLength, baseConfig.n_ctx),
      };

      console.log(`📋 Model config for ${model.name}:`, modelConfig);

      // Load the model using safe wrapper
      this.llamaContext = await createLlamaContext(modelConfig);
      
      if (!this.llamaContext) {
        throw new Error('Failed to create LlamaContext');
      }
      
      model.isLoaded = true;
      this.currentModel = model;
      this.isModelLoading = false;
      this.loadingProgress = 100;

      console.log(`✅ Model ${model.name} loaded successfully`);
      
      // Save active model info
      await AsyncStorage.setItem('active_model', JSON.stringify({
        id: model.id,
        loadedAt: new Date().toISOString()
      }));
      
      return true;

    } catch (error) {
      this.isModelLoading = false;
      console.error('❌ Failed to load model:', error);
      
      // Reset state on failure
      this.llamaContext = null;
      this.currentModel = null;
      if (this.availableModels.find(m => m.id === modelId)) {
        this.availableModels.find(m => m.id === modelId)!.isLoaded = false;
      }
      
      Alert.alert('Model Loading Error', `Failed to load model: ${error.message}`);
      return false;
    }
  }

  @action
  async unloadModel(): Promise<void> {
    if (this.llamaContext) {
      console.log(`🔄 Unloading model: ${this.currentModel?.name}`);
      
      await releaseLlamaContext(this.llamaContext);
      this.llamaContext = null;
    }

    if (this.currentModel) {
      this.currentModel.isLoaded = false;
      this.currentModel = null;
    }

    await AsyncStorage.removeItem('active_model');
    console.log('✅ Model unloaded');
  }

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
    if (!this.llamaContext || !this.currentModel) {
      throw new Error('No model loaded. Please load a model first.');
    }

    const {
      maxTokens = 512,
      temperature = 0.7,
      topP = 0.9,
      topK = 40,
      stopWords = [],
      stream = false,
      onToken
    } = options;

    // Format prompt for the specific model
    const formattedPrompt = this.formatPromptForModel(prompt);

    try {
      const completionParams = {
        prompt: formattedPrompt,
        n_predict: maxTokens,
        temperature,
        top_p: topP,
        top_k: topK,
        stop: stopWords,
      };

      if (stream && onToken) {
        // Streaming generation
        let fullResponse = '';
        
        const completion = this.llamaContext.completion(completionParams);
        
        for await (const token of completion) {
          if (token.token) {
            fullResponse += token.token;
            onToken(token.token);
          }
        }
        
        return fullResponse.trim();
      } else {
        // Non-streaming generation
        const result = await this.llamaContext.completion(completionParams);
        return result.text?.trim() || '';
      }

    } catch (error) {
      console.error('❌ Text generation failed:', error);
      throw error;
    }
  }

  private formatPromptForModel(prompt: string): string {
    if (!this.currentModel) return prompt;

    // Format based on model type
    switch (this.currentModel.id) {
      case 'llama3-8b-instruct':
        return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful AI assistant for note-taking. Be concise and helpful.<|eot_id|><|start_header_id|>user<|end_header_id|>

${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

      case 'phi3-mini':
        return `<|system|>
You are a helpful AI assistant for note-taking. Be concise and helpful.<|end|>
<|user|>
${prompt}<|end|>
<|assistant|>
`;

      case 'gemma-2b-it':
        return `<bos><start_of_turn>user
${prompt}<end_of_turn>
<start_of_turn>model
`;

      case 'smolvlm2-500m':
        return `<|im_start|>system
You are a helpful AI assistant specialized in analyzing images and extracting information for note-taking purposes.<|im_end|>
<|im_start|>user
${prompt}<|im_end|>
<|im_start|>assistant
`;

      default:
        return prompt;
    }
  }

  // Convenience methods for note operations
  async summarizeNote(noteContent: string): Promise<string> {
    const prompt = `Please provide a concise summary of the following note in 2-3 sentences:

${noteContent}

Summary:`;

    return this.generateText(prompt, {
      maxTokens: 200,
      temperature: 0.3,
      stopWords: ['User:', 'Human:']
    });
  }

  async enhanceNote(noteContent: string): Promise<string> {
    const prompt = `Please enhance and expand the following note with relevant details, suggestions, and better structure while maintaining the original intent:

${noteContent}

Enhanced version:`;

    return this.generateText(prompt, {
      maxTokens: 400,
      temperature: 0.6,
      stopWords: ['User:', 'Human:']
    });
  }

  async categorizeNote(noteContent: string): Promise<string> {
    const prompt = `Analyze the following text and categorize it into one of these categories: Work, Personal, Shopping, Travel, Health, Finance, Education, Ideas, Tasks, Reference.

Text: ${noteContent}

Category:`;

    return this.generateText(prompt, {
      maxTokens: 50,
      temperature: 0.2,
      stopWords: ['User:', 'Human:', '\n']
    });
  }

  // Vision-specific methods for SmolVLM2
  async analyzeImage(imagePath: string, query?: string): Promise<string> {
    if (!this.currentModel?.isVision) {
      throw new Error('Current model does not support vision. Please load SmolVLM2.');
    }

    const prompt = query || "Describe this image in detail and extract any text you can see.";
    
    // For vision models, we need to pass the image along with the prompt
    // This depends on llama.rn's vision API implementation
    try {
      const result = await this.generateText(prompt, {
        maxTokens: 400,
        temperature: 0.3,
        // Note: Image handling would need to be implemented based on llama.rn's vision API
      });
      
      return result;
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  async extractTextFromImage(imagePath: string): Promise<string> {
    if (!this.currentModel?.isVision) {
      throw new Error('Current model does not support vision. Please load SmolVLM2.');
    }

    const prompt = "Extract all text from this image. Return only the text content, formatted clearly:";
    
    try {
      const result = await this.analyzeImage(imagePath, prompt);
      return result;
    } catch (error) {
      console.error('❌ OCR failed:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  async createVisualNote(imagePath: string, userPrompt?: string): Promise<string> {
    if (!this.currentModel?.isVision) {
      throw new Error('Current model does not support vision. Please load SmolVLM2.');
    }

    const prompt = userPrompt || 
      "Create a comprehensive note based on this image. Include:\n" +
      "1. What you see in the image\n" +
      "2. Any text content (OCR)\n" +
      "3. Key insights or observations\n" +
      "4. Suggested actions or follow-ups\n\n" +
      "Format as a well-structured note:";
    
    try {
      const result = await this.analyzeImage(imagePath, prompt);
      return result;
    } catch (error) {
      console.error('❌ Visual note creation failed:', error);
      throw new Error(`Visual note creation failed: ${error.message}`);
    }
  }

  async describeImageForNote(imagePath: string): Promise<string> {
    if (!this.currentModel?.isVision) {
      throw new Error('Current model does not support vision. Please load SmolVLM2.');
    }

    const prompt = "Describe this image concisely for a note-taking context. Focus on important details, text content, and actionable information:";
    
    try {
      const result = await this.analyzeImage(imagePath, prompt);
      return result;
    } catch (error) {
      console.error('❌ Image description failed:', error);
      throw new Error(`Image description failed: ${error.message}`);
    }
  }

  @action
  async deleteModel(modelId: string): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      return false;
    }

    try {
      if (model.isLoaded && this.currentModel?.id === modelId) {
        await this.unloadModel();
      }

      if (await RNFS.exists(model.path)) {
        await RNFS.unlink(model.path);
      }

      model.isDownloaded = false;
      model.isLoaded = false;

      console.log(`🗑️ Model ${model.name} deleted`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete model ${model.name}:`, error);
      return false;
    }
  }

  // Getters
  getModelInfo(modelId: string): AIModel | null {
    return this.availableModels.find(m => m.id === modelId) || null;
  }

  getActiveModel(): AIModel | null {
    return this.currentModel;
  }

  isModelLoaded(): boolean {
    return this.llamaContext !== null;
  }

  getAllModels(): AIModel[] {
    return this.availableModels;
  }

  getDownloadProgress(modelId: string): DownloadProgress | undefined {
    return this.downloadProgress.get(modelId);
  }
}

// Singleton instance
export const improvedAIService = new ImprovedAIService();
export default improvedAIService;
