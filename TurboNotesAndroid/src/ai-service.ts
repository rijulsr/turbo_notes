// AI Service - Main interface for AI functionality in Turbo Notes
// Manages AI worker, camera integration, and model operations

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface AITask {
    id: string;
    type: 'summarize' | 'extract_text' | 'enhance' | 'categorize';
    data: any;
}

interface AIResponse {
    id: string;
    result: any;
    error?: string;
}

interface ModelStatus {
    initialized: boolean;
    models: { [key: string]: boolean };
    loading: boolean;
    error?: string;
}

export class AIService {
    private worker: Worker | null = null;
    private taskQueue: Map<string, { resolve: Function; reject: Function }> = new Map();
    private status: ModelStatus = {
        initialized: false,
        models: {},
        loading: false
    };
    private listeners: Set<Function> = new Set();

    constructor() {
        this.initializeWorker();
    }

    private initializeWorker() {
        try {
            // Create AI worker
            this.worker = new Worker(new URL('./ai-worker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
            this.worker.addEventListener('error', this.handleWorkerError.bind(this));

            this.status.loading = true;
            this.notifyListeners();

            // Initialize models
            this.worker.postMessage({ type: 'initialize' });

        } catch (error) {
            console.error('❌ Failed to initialize AI worker:', error);
            this.status.error = `Failed to initialize AI: ${error.message}`;
            this.notifyListeners();
        }
    }

    private handleWorkerMessage(event: MessageEvent) {
        const { type, data } = event.data;

        switch (type) {
            case 'models_ready':
                this.status.initialized = true;
                this.status.loading = false;
                this.status.models = data.reduce((acc: any, model: string) => {
                    acc[model] = true;
                    return acc;
                }, {});
                console.log('🤖 AI models ready:', data);
                this.notifyListeners();
                break;

            case 'initialization_error':
                this.status.loading = false;
                this.status.error = data.error;
                console.error('❌ AI initialization error:', data.error);
                this.notifyListeners();
                break;

            case 'task_result':
                const response: AIResponse = data;
                const taskHandler = this.taskQueue.get(response.id);
                if (taskHandler) {
                    if (response.error) {
                        taskHandler.reject(new Error(response.error));
                    } else {
                        taskHandler.resolve(response.result);
                    }
                    this.taskQueue.delete(response.id);
                }
                break;

            case 'status_response':
                this.status = { ...this.status, ...data };
                this.notifyListeners();
                break;

            default:
                console.warn('Unknown worker message type:', type);
        }
    }

    private handleWorkerError(error: ErrorEvent) {
        console.error('❌ AI worker error:', error);
        this.status.error = `Worker error: ${error.message}`;
        this.notifyListeners();
    }

    private generateTaskId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    private async executeTask(type: AITask['type'], data: any): Promise<any> {
        if (!this.worker) {
            throw new Error('AI worker not initialized');
        }

        if (!this.status.initialized) {
            throw new Error('AI models not ready yet');
        }

        const taskId = this.generateTaskId();
        const task: AITask = { id: taskId, type, data };

        return new Promise((resolve, reject) => {
            this.taskQueue.set(taskId, { resolve, reject });
            
            // Set timeout for task
            setTimeout(() => {
                if (this.taskQueue.has(taskId)) {
                    this.taskQueue.delete(taskId);
                    reject(new Error('Task timeout'));
                }
            }, 30000); // 30 second timeout

            this.worker!.postMessage({
                type: 'process_task',
                data: task
            });
        });
    }

    // Public API methods

    /**
     * Summarize a note using local AI
     */
    async summarizeNote(noteContent: string): Promise<string> {
        if (!noteContent.trim()) {
            throw new Error('Note content cannot be empty');
        }

        try {
            const summary = await this.executeTask('summarize', { text: noteContent });
            return summary;
        } catch (error) {
            console.error('❌ Failed to summarize note:', error);
            throw new Error(`Summarization failed: ${error.message}`);
        }
    }

    /**
     * Enhance a note with additional context and details
     */
    async enhanceNote(noteContent: string): Promise<string> {
        if (!noteContent.trim()) {
            throw new Error('Note content cannot be empty');
        }

        try {
            const enhanced = await this.executeTask('enhance', { text: noteContent });
            return enhanced;
        } catch (error) {
            console.error('❌ Failed to enhance note:', error);
            throw new Error(`Enhancement failed: ${error.message}`);
        }
    }

    /**
     * Categorize a note automatically
     */
    async categorizeNote(noteContent: string): Promise<{ category: string; confidence: number }> {
        if (!noteContent.trim()) {
            throw new Error('Note content cannot be empty');
        }

        try {
            const result = await this.executeTask('categorize', { text: noteContent });
            return result;
        } catch (error) {
            console.error('❌ Failed to categorize note:', error);
            throw new Error(`Categorization failed: ${error.message}`);
        }
    }

    /**
     * Take a photo and extract text from it
     */
    async takePhotoAndExtractText(): Promise<{ imageUrl: string; extractedText: string }> {
        try {
            // Request camera permissions and take photo
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
            });

            if (!image.webPath) {
                throw new Error('Failed to capture image');
            }

            // Extract text from the image
            const extractedText = await this.executeTask('extract_text', { 
                imageUrl: image.webPath 
            });

            return {
                imageUrl: image.webPath,
                extractedText
            };

        } catch (error) {
            console.error('❌ Failed to take photo and extract text:', error);
            throw new Error(`Photo processing failed: ${error.message}`);
        }
    }

    /**
     * Select image from gallery and extract text
     */
    async selectImageAndExtractText(): Promise<{ imageUrl: string; extractedText: string }> {
        try {
            // Select image from gallery
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Photos,
            });

            if (!image.webPath) {
                throw new Error('Failed to select image');
            }

            // Extract text from the image
            const extractedText = await this.executeTask('extract_text', { 
                imageUrl: image.webPath 
            });

            return {
                imageUrl: image.webPath,
                extractedText
            };

        } catch (error) {
            console.error('❌ Failed to select image and extract text:', error);
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    /**
     * Save extracted text as a new note with image reference
     */
    async saveImageNote(imageUrl: string, extractedText: string, additionalNotes?: string): Promise<string> {
        try {
            let noteContent = `📸 Image Note\n\n`;
            
            if (extractedText) {
                noteContent += `**Extracted Text:**\n${extractedText}\n\n`;
            }
            
            if (additionalNotes) {
                noteContent += `**Additional Notes:**\n${additionalNotes}\n\n`;
            }
            
            noteContent += `**Image:** ${imageUrl}\n`;
            noteContent += `**Created:** ${new Date().toLocaleString()}`;

            return noteContent;

        } catch (error) {
            console.error('❌ Failed to create image note:', error);
            throw new Error(`Failed to create image note: ${error.message}`);
        }
    }

    /**
     * Get current AI service status
     */
    getStatus(): ModelStatus {
        return { ...this.status };
    }

    /**
     * Check if AI features are available
     */
    isReady(): boolean {
        return this.status.initialized && !this.status.loading && !this.status.error;
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: (status: ModelStatus) => void): () => void {
        this.listeners.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.status);
            } catch (error) {
                console.error('❌ Error in status listener:', error);
            }
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.taskQueue.clear();
        this.listeners.clear();
    }

    /**
     * Restart AI service (useful if something goes wrong)
     */
    restart() {
        this.destroy();
        this.status = {
            initialized: false,
            models: {},
            loading: false
        };
        this.initializeWorker();
    }
}

// Export singleton instance
export const aiService = new AIService();


