/**
 * Llama.rn setup utilities
 * Handles proper initialization and error handling for llama.rn
 */

import { initLlama, LlamaContext } from 'llama.rn';
import { Alert, Platform } from 'react-native';

let isLlamaInitialized = false;

/**
 * Initialize llama.rn with proper error handling
 */
export async function initializeLlama(): Promise<boolean> {
  if (isLlamaInitialized) {
    return true;
  }

  try {
    console.log('🚀 Initializing llama.rn...');
    
    // Check platform compatibility
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      throw new Error('llama.rn is only supported on iOS and Android');
    }

    await initLlama();
    isLlamaInitialized = true;
    
    console.log('✅ llama.rn initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize llama.rn:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to initialize AI engine';
    
    if (error.message?.includes('not found') || error.message?.includes('undefined')) {
      errorMessage = 'AI engine not properly installed. Please reinstall the app.';
    } else if (error.message?.includes('permission')) {
      errorMessage = 'AI engine requires additional permissions. Please check app settings.';
    } else if (error.message?.includes('memory')) {
      errorMessage = 'Insufficient memory to initialize AI engine. Please close other apps.';
    }
    
    Alert.alert('AI Initialization Error', errorMessage);
    return false;
  }
}

/**
 * Create LlamaContext with error handling and validation
 */
export async function createLlamaContext(config: any): Promise<LlamaContext | null> {
  try {
    // Ensure llama is initialized first
    if (!isLlamaInitialized) {
      const initialized = await initializeLlama();
      if (!initialized) {
        throw new Error('llama.rn not initialized');
      }
    }

    // Validate config
    if (!config.model) {
      throw new Error('Model path is required');
    }

    // Set safe defaults
    const safeConfig = {
      model: config.model,
      n_ctx: Math.min(config.n_ctx || 2048, 8192), // Limit context for mobile
      n_batch: Math.min(config.n_batch || 512, 1024),
      n_threads: config.n_threads || -1,
      n_gpu_layers: config.n_gpu_layers || 0, // Start with CPU
      use_mmap: config.use_mmap !== false, // Default to true
      use_mlock: config.use_mlock || false,
      verbose_prompt: config.verbose_prompt || false,
      ...config
    };

    console.log('🔧 Creating LlamaContext with config:', safeConfig);
    
    const context = await LlamaContext.init(safeConfig);
    
    console.log('✅ LlamaContext created successfully');
    return context;
    
  } catch (error) {
    console.error('❌ Failed to create LlamaContext:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to load AI model';
    
    if (error.message?.includes('file not found') || error.message?.includes('No such file')) {
      errorMessage = 'Model file not found. Please download the model first.';
    } else if (error.message?.includes('memory') || error.message?.includes('allocation')) {
      errorMessage = 'Insufficient memory to load model. Try a smaller model or close other apps.';
    } else if (error.message?.includes('format') || error.message?.includes('invalid')) {
      errorMessage = 'Invalid model format. Please download a compatible GGUF model.';
    } else if (error.message?.includes('permission')) {
      errorMessage = 'Cannot access model file. Check file permissions.';
    }
    
    Alert.alert('Model Loading Error', errorMessage);
    return null;
  }
}

/**
 * Safely release LlamaContext
 */
export async function releaseLlamaContext(context: LlamaContext): Promise<void> {
  try {
    if (context) {
      await context.release();
      console.log('✅ LlamaContext released successfully');
    }
  } catch (error) {
    console.error('❌ Error releasing LlamaContext:', error);
    // Don't throw error here as it's cleanup code
  }
}

/**
 * Check if llama.rn is available and working
 */
export async function checkLlamaAvailability(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    // Check if llama.rn module is available
    if (!initLlama || !LlamaContext) {
      return {
        available: false,
        error: 'llama.rn module not found. Please install llama.rn package.'
      };
    }

    // Try to initialize
    const initialized = await initializeLlama();
    if (!initialized) {
      return {
        available: false,
        error: 'Failed to initialize llama.rn'
      };
    }

    return { available: true };
    
  } catch (error) {
    return {
      available: false,
      error: error.message || 'Unknown error checking llama.rn availability'
    };
  }
}

/**
 * Get recommended model configuration for mobile
 */
export function getRecommendedModelConfig(modelSize: 'small' | 'medium' | 'large'): any {
  const baseConfig = {
    n_threads: -1,
    use_mmap: true,
    use_mlock: false,
    verbose_prompt: false,
    n_gpu_layers: 0, // Start with CPU for stability
  };

  switch (modelSize) {
    case 'small': // < 3GB
      return {
        ...baseConfig,
        n_ctx: 2048,
        n_batch: 512,
      };
    
    case 'medium': // 3-6GB
      return {
        ...baseConfig,
        n_ctx: 4096,
        n_batch: 256,
      };
    
    case 'large': // > 6GB
      return {
        ...baseConfig,
        n_ctx: 2048, // Reduce context for large models
        n_batch: 128,
      };
    
    default:
      return {
        ...baseConfig,
        n_ctx: 2048,
        n_batch: 512,
      };
  }
}

export { isLlamaInitialized };

