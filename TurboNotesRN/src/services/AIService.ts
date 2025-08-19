import { LlamaContext } from 'llama.rn';
import { ChatFormatter } from 'chat-formatter';
import RNFS from 'react-native-fs';
import { makeObservable, observable, action, computed } from 'mobx';
import { Alert } from 'react-native';

export interface AIModel {
  id: string;
  name: string;
  size: number;
  path: string;
  isDownloaded: boolean;
  isLoaded: boolean;
  description: string;
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

export interface AITask {
  id: string;
  type: 'summarize' | 'enhance' | 'categorize' | 'extract_text' | 'chat';
  input: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  progress?: number;
}

class AIService {
  // Observable state
  @observable isInitialized = false;
  @observable currentModel: AIModel | null = null;
  @observable availableModels: AIModel[] = [];
  @observable activeTasks: Map<string, AITask> = new Map();
  @observable llamaContext: LlamaContext | null = null;
  @observable isModelLoading = false;
  @observable loadingProgress = 0;

  // Chat formatter for different model templates
  private chatFormatter: ChatFormatter | null = null;

  constructor() {
    makeObservable(this);
    this.initializeService();
  }

  @action
  private async initializeService() {
    try {
      // Initialize available models
      this.availableModels = [
        {
          id: 'gemma-2b-it',
          name: 'Gemma 2B Instruct',
          size: 1.4 * 1024 * 1024 * 1024, // 1.4GB
          path: `${RNFS.DocumentDirectoryPath}/models/gemma-2b-it-q4_0.gguf`,
          isDownloaded: false,
          isLoaded: false,
          description: 'Fast, efficient model for note enhancement and summarization',
          capabilities: ['text-generation', 'summarization', 'enhancement', 'categorization']
        },
        {
          id: 'llama3-8b-instruct',
          name: 'Llama 3 8B Instruct',
          size: 4.3 * 1024 * 1024 * 1024, // 4.3GB
          path: `${RNFS.DocumentDirectoryPath}/models/llama3-8b-instruct-q4_0.gguf`,
          isDownloaded: false,
          isLoaded: false,
          description: 'Powerful model for complex reasoning and detailed analysis',
          capabilities: ['text-generation', 'reasoning', 'analysis', 'coding']
        },
        {
          id: 'phi3-mini',
          name: 'Phi-3 Mini',
          size: 2.1 * 1024 * 1024 * 1024, // 2.1GB
          path: `${RNFS.DocumentDirectoryPath}/models/phi3-mini-q4_0.gguf`,
          isDownloaded: false,
          isLoaded: false,
          description: 'Compact model optimized for mobile devices',
          capabilities: ['text-generation', 'summarization', 'qa']
        }
      ];

      // Check which models are already downloaded
      await this.checkDownloadedModels();
      
      this.isInitialized = true;
      console.log('🤖 AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
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
          console.log(`📦 Model ${model.name} found: ${(stat.size / 1024 / 1024 / 1024).toFixed(2)}GB`);
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
    return this.isInitialized && this.currentModel?.isLoaded;
  }

  @action
  async loadModel(modelId: string): Promise<boolean> {
    try {
      const model = this.availableModels.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      if (!model.isDownloaded) {
        throw new Error(`Model ${model.name} is not downloaded`);
      }

      this.isModelLoading = true;
      this.loadingProgress = 0;

      console.log(`🔄 Loading model: ${model.name}`);

      // Initialize LlamaContext with the model
      this.llamaContext = await LlamaContext.initFromFile(model.path, {
        // GPU acceleration if available
        ngl: 32, // GPU layers
        // Memory optimization
        nCtx: 2048, // Context length
        nBatch: 512, // Batch size
        // Performance settings
        nThreads: -1, // Use all available threads
        // Callback for loading progress
        onProgress: (progress: number) => {
          this.loadingProgress = progress;
        }
      });

      // Initialize chat formatter for this model
      this.chatFormatter = new ChatFormatter();
      
      model.isLoaded = true;
      this.currentModel = model;
      this.isModelLoading = false;
      this.loadingProgress = 100;

      console.log(`✅ Model ${model.name} loaded successfully`);
      return true;

    } catch (error) {
      this.isModelLoading = false;
      console.error('❌ Failed to load model:', error);
      Alert.alert('Model Loading Error', error.message);
      return false;
    }
  }

  @action
  async unloadModel() {
    if (this.llamaContext) {
      await this.llamaContext.release();
      this.llamaContext = null;
    }

    if (this.currentModel) {
      this.currentModel.isLoaded = false;
      this.currentModel = null;
    }

    this.chatFormatter = null;
    console.log('📤 Model unloaded');
  }

  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stopWords?: string[];
      stream?: boolean;
      onToken?: (token: string) => void;
    } = {}
  ): Promise<string> {
    if (!this.llamaContext || !this.currentModel) {
      throw new Error('No model loaded');
    }

    const {
      maxTokens = 512,
      temperature = 0.7,
      topP = 0.9,
      stopWords = [],
      stream = false,
      onToken
    } = options;

    try {
      let fullResponse = '';

      if (stream && onToken) {
        // Streaming generation
        const completion = this.llamaContext.completion({
          prompt,
          n_predict: maxTokens,
          temperature,
          top_p: topP,
          stop: stopWords,
        });

        for await (const token of completion) {
          fullResponse += token.token;
          onToken(token.token);
        }
      } else {
        // Non-streaming generation
        const result = await this.llamaContext.completion({
          prompt,
          n_predict: maxTokens,
          temperature,
          top_p: topP,
          stop: stopWords,
        });

        fullResponse = result.text;
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('❌ Text generation failed:', error);
      throw error;
    }
  }

  @action
  async summarizeNote(noteContent: string): Promise<string> {
    const taskId = `summarize_${Date.now()}`;
    const task: AITask = {
      id: taskId,
      type: 'summarize',
      input: noteContent,
      status: 'processing',
      progress: 0
    };

    this.activeTasks.set(taskId, task);

    try {
      const prompt = this.buildSummarizePrompt(noteContent);
      
      const summary = await this.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.3,
        stopWords: ['Human:', 'User:']
      });

      task.status = 'completed';
      task.result = summary;
      task.progress = 100;

      return summary;
    } catch (error) {
      task.status = 'error';
      task.error = error.message;
      throw error;
    } finally {
      // Clean up task after 5 minutes
      setTimeout(() => {
        this.activeTasks.delete(taskId);
      }, 5 * 60 * 1000);
    }
  }

  @action
  async enhanceNote(noteContent: string): Promise<string> {
    const taskId = `enhance_${Date.now()}`;
    const task: AITask = {
      id: taskId,
      type: 'enhance',
      input: noteContent,
      status: 'processing',
      progress: 0
    };

    this.activeTasks.set(taskId, task);

    try {
      const prompt = this.buildEnhancePrompt(noteContent);
      
      const enhanced = await this.generateText(prompt, {
        maxTokens: 400,
        temperature: 0.6,
        stopWords: ['Human:', 'User:']
      });

      task.status = 'completed';
      task.result = enhanced;
      task.progress = 100;

      return enhanced;
    } catch (error) {
      task.status = 'error';
      task.error = error.message;
      throw error;
    }
  }

  @action
  async categorizeNote(noteContent: string): Promise<{ category: string; confidence: number; reasoning: string }> {
    const taskId = `categorize_${Date.now()}`;
    const task: AITask = {
      id: taskId,
      type: 'categorize',
      input: noteContent,
      status: 'processing',
      progress: 0
    };

    this.activeTasks.set(taskId, task);

    try {
      const prompt = this.buildCategorizePrompt(noteContent);
      
      const result = await this.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.2,
        stopWords: ['Human:', 'User:']
      });

      // Parse structured output
      const parsed = this.parseCategoryResult(result);
      
      task.status = 'completed';
      task.result = JSON.stringify(parsed);
      task.progress = 100;

      return parsed;
    } catch (error) {
      task.status = 'error';
      task.error = error.message;
      throw error;
    }
  }

  private buildSummarizePrompt(content: string): string {
    return `You are a helpful assistant that creates concise summaries of notes.

Please summarize the following note in 2-3 sentences, capturing the key points:

Note: ${content}

Summary:`;
  }

  private buildEnhancePrompt(content: string): string {
    return `You are a helpful assistant that enhances notes by adding relevant context, suggestions, and structure.

Please enhance the following note by:
- Adding relevant details and context
- Suggesting action items if appropriate
- Organizing information clearly
- Maintaining the original intent

Original Note: ${content}

Enhanced Note:`;
  }

  private buildCategorizePrompt(content: string): string {
    return `You are a helpful assistant that categorizes notes. Analyze the following note and assign it to one of these categories:

Categories: Work, Personal, Shopping, Travel, Health, Finance, Education, Ideas, Tasks, Reference

Please respond in this exact format:
Category: [CATEGORY_NAME]
Confidence: [0.0-1.0]
Reasoning: [Brief explanation]

Note: ${content}

Analysis:`;
  }

  private parseCategoryResult(result: string): { category: string; confidence: number; reasoning: string } {
    const lines = result.split('\n');
    let category = 'Personal';
    let confidence = 0.5;
    let reasoning = 'Unable to determine specific reasoning';

    for (const line of lines) {
      if (line.startsWith('Category:')) {
        category = line.replace('Category:', '').trim();
      } else if (line.startsWith('Confidence:')) {
        const conf = parseFloat(line.replace('Confidence:', '').trim());
        if (!isNaN(conf)) confidence = conf;
      } else if (line.startsWith('Reasoning:')) {
        reasoning = line.replace('Reasoning:', '').trim();
      }
    }

    return { category, confidence, reasoning };
  }

  @action
  async downloadModel(modelId: string, onProgress?: (progress: number) => void): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isDownloaded) {
      return true;
    }

    try {
      // Create models directory if it doesn't exist
      const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
      if (!(await RNFS.exists(modelsDir))) {
        await RNFS.mkdir(modelsDir);
      }

      // Download URLs (these would be real URLs in production)
      const downloadUrls: { [key: string]: string } = {
        'gemma-2b-it': 'https://huggingface.co/google/gemma-2b-it-GGUF/resolve/main/gemma-2b-it.q4_0.gguf',
        'llama3-8b-instruct': 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
        'phi3-mini': 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf'
      };

      const url = downloadUrls[modelId];
      if (!url) {
        throw new Error(`Download URL not found for model ${modelId}`);
      }

      console.log(`📥 Downloading model: ${model.name}`);

      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: model.path,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          onProgress?.(progress);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        model.isDownloaded = true;
        console.log(`✅ Model ${model.name} downloaded successfully`);
        return true;
      } else {
        throw new Error(`Download failed with status ${downloadResult.statusCode}`);
      }

    } catch (error) {
      console.error(`❌ Failed to download model ${model.name}:`, error);
      throw error;
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

  // Get model info and status
  getModelInfo(modelId: string): AIModel | null {
    return this.availableModels.find(m => m.id === modelId) || null;
  }

  // Get active tasks
  getActiveTasks(): AITask[] {
    return Array.from(this.activeTasks.values());
  }

  // Cancel a task
  @action
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'processing') {
      task.status = 'error';
      task.error = 'Cancelled by user';
      return true;
    }
    return false;
  }
}

// Singleton instance
export const aiService = new AIService();
export default aiService;
