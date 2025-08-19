import React from 'react';
import { Database } from '@nozbe/watermelondb';
import { makeObservable, observable, action } from 'mobx';
import NotesStore from './NotesStore';
import ChatStore from './ChatStore';
import UIStore from './UIStore';
import SettingsStore from './SettingsStore';
import aiService from '../services/AIService';

export class RootStore {
  @observable isInitialized = false;
  @observable initializationError: string | null = null;

  // Store instances
  notesStore: NotesStore;
  chatStore: ChatStore;
  uiStore: UIStore;
  settingsStore: SettingsStore;

  // Services
  aiService = aiService;

  constructor(private database: Database) {
    makeObservable(this);
    
    // Initialize stores
    this.notesStore = new NotesStore(database);
    this.chatStore = new ChatStore(database);
    this.uiStore = new UIStore();
    this.settingsStore = new SettingsStore();
  }

  @action
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing RootStore...');

      // Initialize settings first
      await this.settingsStore.initialize();
      
      // Initialize UI store with settings
      await this.uiStore.initialize(this.settingsStore);
      
      // Initialize notes store (loads notes from database)
      await this.notesStore.loadNotes();
      
      // Initialize chat store
      await this.chatStore.initialize();
      
      // Initialize AI service (loads available models)
      // Note: AI service initializes itself in constructor
      
      this.isInitialized = true;
      console.log('✅ RootStore initialized successfully');
      
    } catch (error) {
      this.initializationError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ RootStore initialization failed:', error);
      throw error;
    }
  }

  @action
  reset(): void {
    // Reset all stores to initial state
    this.isInitialized = false;
    this.initializationError = null;
    
    // Reset individual stores
    this.uiStore.reset();
    this.settingsStore.reset();
    
    console.log('🔄 RootStore reset');
  }

  // Cleanup method for app shutdown
  async cleanup(): Promise<void> {
    try {
      // Unload AI models
      await this.aiService.unloadModel();
      
      // Close database connections if needed
      // WatermelonDB handles this automatically
      
      console.log('🧹 RootStore cleanup completed');
    } catch (error) {
      console.error('❌ RootStore cleanup failed:', error);
    }
  }
}

// React Context for dependency injection
export const RootStoreContext = React.createContext<RootStore | null>(null);

export const RootStoreProvider: React.FC<{
  value: RootStore;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <RootStoreContext.Provider value={value}>
      {children}
    </RootStoreContext.Provider>
  );
};

// Hook to access root store
export const useRootStore = (): RootStore => {
  const store = React.useContext(RootStoreContext);
  if (!store) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }
  return store;
};

// Individual store hooks for convenience
export const useNotesStore = (): NotesStore => {
  return useRootStore().notesStore;
};

export const useChatStore = (): ChatStore => {
  return useRootStore().chatStore;
};

export const useUIStore = (): UIStore => {
  return useRootStore().uiStore;
};

export const useSettingsStore = (): SettingsStore => {
  return useRootStore().settingsStore;
};

export const useAIService = () => {
  return useRootStore().aiService;
};

export default RootStore;
