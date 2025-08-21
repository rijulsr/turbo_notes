/**
 * HuggingFace API Service
 * Provides comprehensive integration with HuggingFace Hub for model discovery,
 * download URL resolution, and model metadata retrieval.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HuggingFaceModel {
  id: string;
  author: string;
  modelName: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified: string;
  files: HuggingFaceFile[];
  pipeline_tag?: string;
  library_name?: string;
  description?: string;
}

export interface HuggingFaceFile {
  rfilename: string;
  size: number;
  lfs?: {
    oid: string;
    size: number;
  };
}

export interface ModelSearchParams {
  search?: string;
  author?: string;
  tags?: string[];
  pipeline_tag?: string;
  library?: string[];
  sort?: 'downloads' | 'likes' | 'lastModified' | 'trending';
  direction?: 'asc' | 'desc';
  limit?: number;
  filter?: 'gguf' | 'safetensors' | 'pytorch';
}

export interface ProcessedModel {
  id: string;
  name: string;
  author: string;
  description: string;
  size: number; // in MB
  downloads: number;
  likes: number;
  tags: string[];
  capabilities: string[];
  downloadUrl: string;
  fileName: string;
  isVision: boolean;
  contextLength: number;
  category: string;
  modelType: string;
  quantization: string;
  lastModified: string;
  pipeline_tag?: string;
}

class HuggingFaceService {
  private baseUrl = 'https://huggingface.co';
  private apiUrl = 'https://huggingface.co/api';
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for GGUF models on HuggingFace Hub
   */
  async searchModels(params: ModelSearchParams = {}): Promise<ProcessedModel[]> {
    const {
      search = '',
      author = '',
      tags = [],
      pipeline_tag = '',
      library = ['gguf'],
      sort = 'downloads',
      direction = 'desc',
      limit = 50,
      filter = 'gguf'
    } = params;

    const cacheKey = `search_${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Build search query
      const searchParams = new URLSearchParams({
        search: search,
        sort: sort,
        direction: direction,
        limit: limit.toString(),
        full: 'true',
        config: 'true'
      });

      // Add filters
      if (author) searchParams.append('author', author);
      if (pipeline_tag) searchParams.append('pipeline_tag', pipeline_tag);
      
      // Add tags
      tags.forEach(tag => searchParams.append('tags', tag));
      library.forEach(lib => searchParams.append('library', lib));

      // Add GGUF filter
      searchParams.append('tags', 'gguf');

      const response = await fetch(`${this.apiUrl}/models?${searchParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TurboNotes/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const models: HuggingFaceModel[] = await response.json();
      
      // Process and filter models
      const processedModels = await Promise.all(
        models
          .filter(model => this.isValidGGUFModel(model))
          .map(model => this.processModel(model))
      );

      // Filter out invalid models and sort by relevance
      const validModels = processedModels
        .filter(model => model !== null)
        .sort((a, b) => {
          if (sort === 'downloads') return direction === 'desc' ? b.downloads - a.downloads : a.downloads - b.downloads;
          if (sort === 'likes') return direction === 'desc' ? b.likes - a.likes : a.likes - b.likes;
          if (sort === 'lastModified') return direction === 'desc' ? 
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime() :
            new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          return 0;
        });

      this.setCache(cacheKey, validModels);
      return validModels;

    } catch (error) {
      console.error('❌ HuggingFace search failed:', error);
      throw new Error(`Failed to search models: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelDetails(modelId: string): Promise<ProcessedModel | null> {
    const cacheKey = `model_${modelId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/models/${modelId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TurboNotes/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const model: HuggingFaceModel = await response.json();
      const processedModel = await this.processModel(model);
      
      if (processedModel) {
        this.setCache(cacheKey, processedModel);
      }
      
      return processedModel;

    } catch (error) {
      console.error(`❌ Failed to get model details for ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Get curated list of recommended models for different use cases
   */
  async getRecommendedModels(): Promise<{
    vision: ProcessedModel[];
    lightweight: ProcessedModel[];
    balanced: ProcessedModel[];
    specialized: ProcessedModel[];
    multilingual: ProcessedModel[];
  }> {
    const cacheKey = 'recommended_models';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Define recommended model IDs by category
      const recommendations = {
        vision: [
          'bartowski/SmolVLM2-500M-Instruct-GGUF',
          'mradermacher/llava-phi-3-mini-i1-GGUF',
          'bartowski/LLaVA-NeXT-Video-7B-GGUF'
        ],
        lightweight: [
          'bartowski/TinyLlama-1.1B-Chat-v1.0-GGUF',
          'bartowski/Qwen2-1.5B-Instruct-GGUF',
          'bartowski/SmolLM-1.7B-Instruct-GGUF'
        ],
        balanced: [
          'bartowski/gemma-2b-it-GGUF',
          'bartowski/Phi-3-mini-4k-instruct-GGUF',
          'bartowski/Llama-3.2-3B-Instruct-GGUF'
        ],
        specialized: [
          'bartowski/CodeQwen1.5-7B-Chat-GGUF',
          'bartowski/Mistral-7B-Instruct-v0.2-GGUF',
          'bartowski/openchat-3.5-0106-GGUF'
        ],
        multilingual: [
          'bartowski/aya-23-8B-GGUF',
          'bartowski/Qwen2-7B-Instruct-GGUF'
        ]
      };

      const results: any = {};
      
      for (const [category, modelIds] of Object.entries(recommendations)) {
        const models = await Promise.all(
          modelIds.map(id => this.getModelDetails(id))
        );
        results[category] = models.filter(model => model !== null);
      }

      this.setCache(cacheKey, results);
      return results;

    } catch (error) {
      console.error('❌ Failed to get recommended models:', error);
      // Return empty categories on error
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
   * Validate download URL and get file info
   */
  async validateDownloadUrl(modelId: string, fileName: string): Promise<{
    url: string;
    size: number;
    isValid: boolean;
    alternativeUrls?: string[];
  }> {
    const primaryUrl = `${this.baseUrl}/${modelId}/resolve/main/${fileName}`;
    
    try {
      // Try HEAD request to check if file exists
      const response = await fetch(primaryUrl, { 
        method: 'HEAD',
        headers: { 'User-Agent': 'TurboNotes/1.0' }
      });

      if (response.ok) {
        const size = parseInt(response.headers.get('content-length') || '0');
        return {
          url: primaryUrl,
          size,
          isValid: true
        };
      }

      // If primary URL fails, try alternative repositories
      const alternativeRepos = [
        'bartowski',
        'mradermacher', 
        'TheBloke',
        'microsoft',
        'google',
        'meta-llama'
      ];

      const alternativeUrls = [];
      
      for (const repo of alternativeRepos) {
        const altModelId = modelId.includes('/') ? modelId : `${repo}/${modelId.split('/')[1] || modelId}`;
        const altUrl = `${this.baseUrl}/${altModelId}/resolve/main/${fileName}`;
        
        try {
          const altResponse = await fetch(altUrl, { 
            method: 'HEAD',
            headers: { 'User-Agent': 'TurboNotes/1.0' }
          });
          
          if (altResponse.ok) {
            const size = parseInt(altResponse.headers.get('content-length') || '0');
            return {
              url: altUrl,
              size,
              isValid: true,
              alternativeUrls: [altUrl]
            };
          }
        } catch (error) {
          // Continue to next alternative
        }
      }

      return {
        url: primaryUrl,
        size: 0,
        isValid: false,
        alternativeUrls
      };

    } catch (error) {
      console.error(`❌ Failed to validate download URL for ${modelId}/${fileName}:`, error);
      return {
        url: primaryUrl,
        size: 0,
        isValid: false
      };
    }
  }

  /**
   * Process raw HuggingFace model data into our format
   */
  private async processModel(model: HuggingFaceModel): Promise<ProcessedModel | null> {
    try {
      // Find the best GGUF file
      const ggufFiles = model.files?.filter(file => 
        file.rfilename.toLowerCase().endsWith('.gguf') &&
        (file.rfilename.toLowerCase().includes('q4_k_m') || 
         file.rfilename.toLowerCase().includes('q4_0') ||
         file.rfilename.toLowerCase().includes('q5_k_m'))
      ) || [];

      if (ggufFiles.length === 0) return null;

      // Prefer Q4_K_M quantization, then Q5_K_M, then Q4_0
      const preferredFile = ggufFiles.find(f => f.rfilename.toLowerCase().includes('q4_k_m')) ||
                           ggufFiles.find(f => f.rfilename.toLowerCase().includes('q5_k_m')) ||
                           ggufFiles.find(f => f.rfilename.toLowerCase().includes('q4_0')) ||
                           ggufFiles[0];

      const sizeInMB = Math.round((preferredFile.lfs?.size || preferredFile.size || 0) / (1024 * 1024));
      
      // Determine model capabilities and category
      const capabilities = this.determineCapabilities(model);
      const category = this.determineCategory(model, sizeInMB);
      const isVision = this.isVisionModel(model);
      const contextLength = this.estimateContextLength(model);

      // Get quantization info
      const quantization = this.getQuantizationType(preferredFile.rfilename);

      return {
        id: model.id,
        name: this.formatModelName(model.id),
        author: model.id.split('/')[0],
        description: model.description || `${category} model for ${capabilities.join(', ')}`,
        size: sizeInMB,
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        tags: model.tags || [],
        capabilities,
        downloadUrl: `${this.baseUrl}/${model.id}/resolve/main/${preferredFile.rfilename}`,
        fileName: preferredFile.rfilename,
        isVision,
        contextLength,
        category,
        modelType: model.pipeline_tag || 'text-generation',
        quantization,
        lastModified: model.lastModified || new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to process model ${model.id}:`, error);
      return null;
    }
  }

  /**
   * Check if model is a valid GGUF model for our use case
   */
  private isValidGGUFModel(model: HuggingFaceModel): boolean {
    const hasGGUFTag = model.tags?.includes('gguf') || false;
    const hasGGUFFiles = model.files?.some(file => 
      file.rfilename.toLowerCase().endsWith('.gguf')
    ) || false;
    
    // Filter out very large models (>10GB)
    const hasReasonableSize = model.files?.some(file => 
      (file.lfs?.size || file.size || 0) < 10 * 1024 * 1024 * 1024
    ) || true;

    return (hasGGUFTag || hasGGUFFiles) && hasReasonableSize;
  }

  /**
   * Determine model capabilities based on tags and metadata
   */
  private determineCapabilities(model: HuggingFaceModel): string[] {
    const capabilities = [];
    const tags = model.tags || [];
    const modelId = model.id.toLowerCase();
    
    // Vision capabilities
    if (this.isVisionModel(model)) {
      capabilities.push('vision', 'image-analysis');
      if (modelId.includes('ocr') || tags.includes('ocr')) {
        capabilities.push('text-extraction', 'ocr');
      }
    }

    // Coding capabilities
    if (modelId.includes('code') || tags.includes('code') || model.pipeline_tag === 'text-generation') {
      capabilities.push('coding', 'programming-help');
    }

    // Multilingual
    if (tags.includes('multilingual') || modelId.includes('multilingual') || 
        modelId.includes('qwen') || modelId.includes('aya')) {
      capabilities.push('multilingual', 'translation');
    }

    // Chat and conversation
    if (tags.includes('conversational') || modelId.includes('chat') || 
        modelId.includes('instruct') || modelId.includes('assistant')) {
      capabilities.push('conversation', 'instruction-following');
    }

    // Default capabilities
    if (capabilities.length === 0) {
      capabilities.push('text-generation', 'summarization', 'enhancement');
    }

    return capabilities;
  }

  /**
   * Determine if model is a vision model
   */
  private isVisionModel(model: HuggingFaceModel): boolean {
    const modelId = model.id.toLowerCase();
    const tags = model.tags || [];
    
    return modelId.includes('vision') || 
           modelId.includes('vlm') || 
           modelId.includes('llava') || 
           modelId.includes('smolvlm') ||
           tags.includes('vision') ||
           model.pipeline_tag === 'image-text-to-text';
  }

  /**
   * Determine model category based on size and type
   */
  private determineCategory(model: HuggingFaceModel, sizeInMB: number): string {
    if (this.isVisionModel(model)) return 'Vision';
    if (sizeInMB < 1000) return 'Lightweight';
    if (sizeInMB < 3000) return 'Balanced';
    if (sizeInMB < 6000) return 'High-Performance';
    return 'Large';
  }

  /**
   * Estimate context length based on model name and tags
   */
  private estimateContextLength(model: HuggingFaceModel): number {
    const modelId = model.id.toLowerCase();
    
    if (modelId.includes('32k')) return 32768;
    if (modelId.includes('16k')) return 16384;
    if (modelId.includes('8k')) return 8192;
    if (modelId.includes('4k')) return 4096;
    if (modelId.includes('2k')) return 2048;
    
    // Default based on model size
    const tags = model.tags || [];
    if (this.isVisionModel(model)) return 4096;
    if (tags.includes('long-context')) return 32768;
    
    return 4096; // Safe default
  }

  /**
   * Get quantization type from filename
   */
  private getQuantizationType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.includes('q4_k_m')) return 'Q4_K_M';
    if (lower.includes('q5_k_m')) return 'Q5_K_M';
    if (lower.includes('q4_0')) return 'Q4_0';
    if (lower.includes('q5_0')) return 'Q5_0';
    if (lower.includes('q8_0')) return 'Q8_0';
    return 'Unknown';
  }

  /**
   * Format model name for display
   */
  private formatModelName(modelId: string): string {
    const parts = modelId.split('/');
    const name = parts[parts.length - 1];
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const huggingFaceService = new HuggingFaceService();
export default huggingFaceService;
