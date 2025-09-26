import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { enhancedModelManager, LocalModel } from './EnhancedModelManager';

export interface BenchmarkResult {
  modelId: string;
  modelName: string;
  timestamp: string;
  device: {
    platform: string;
    totalSpaceGB?: number;
    freeSpaceGB?: number;
  };
  coldLoadMs: number;
  completion: {
    promptChars: number;
    outputChars: number;
    elapsedMs: number;
    approxTokensPerSec: number;
  };
}

class BenchmarkService {
  async getStorageInfo(): Promise<{ totalSpaceGB?: number; freeSpaceGB?: number }> {
    try {
      const info = await RNFS.getFSInfo();
      return {
        totalSpaceGB: Math.round((info.totalSpace / 1024 / 1024 / 1024) * 100) / 100,
        freeSpaceGB: Math.round((info.freeSpace / 1024 / 1024 / 1024) * 100) / 100,
      };
    } catch (e) {
      return {};
    }
  }

  private estimateTokensFromChars(charCount: number): number {
    // Rough heuristic: ~4 chars per token for English text
    return Math.max(1, Math.round(charCount / 4));
  }

  private buildBenchmarkPrompt(): string {
    return (
      'You are a concise assistant. Summarize the following note in 3 bullet points.\n' +
      'Note: Turbo Notes is a mobile-first, on-device AI note-taking app. It supports local ' +
      'models downloaded from Hugging Face, device benchmarks, and smart recommendations. Users can ' +
      'create tasks, summarize notes, and extract text from images entirely offline.\n' +
      'Bullets:'
    );
  }

  async runBenchmark(model: LocalModel): Promise<BenchmarkResult> {
    const storage = await this.getStorageInfo();

    const startCold = Date.now();
    // Ensure model is loaded
    if (!model.isLoaded) {
      await enhancedModelManager.loadModel(model.id);
    }
    const coldLoadMs = Date.now() - startCold;

    const prompt = this.buildBenchmarkPrompt();
    const startCompletion = Date.now();
    const output = await enhancedModelManager.generateText(prompt, {
      maxTokens: 256,
      temperature: 0.3,
      stopWords: ['User:', 'Human:'],
    });
    const elapsedMs = Date.now() - startCompletion;

    const approxTokens = this.estimateTokensFromChars(output.length);
    const approxTokensPerSec = Math.round((approxTokens / Math.max(1, elapsedMs)) * 1000 * 100) / 100;

    const result: BenchmarkResult = {
      modelId: model.id,
      modelName: model.name,
      timestamp: new Date().toISOString(),
      device: {
        platform: Platform.OS,
        totalSpaceGB: storage.totalSpaceGB,
        freeSpaceGB: storage.freeSpaceGB,
      },
      coldLoadMs,
      completion: {
        promptChars: prompt.length,
        outputChars: output.length,
        elapsedMs,
        approxTokensPerSec,
      },
    };

    return result;
  }

  getRecommendationBadge(result: BenchmarkResult): 'Good' | 'Fair' | 'Poor' {
    // Simple heuristic: >= 20 tok/s Good, 10-20 Fair, else Poor
    if (result.completion.approxTokensPerSec >= 20) return 'Good';
    if (result.completion.approxTokensPerSec >= 10) return 'Fair';
    return 'Poor';
  }
}

export const benchmarkService = new BenchmarkService();
export default benchmarkService;


