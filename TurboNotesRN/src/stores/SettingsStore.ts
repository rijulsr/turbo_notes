import { makeObservable, observable, action, computed } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from '@react-native-encrypted-storage/encrypted-storage';

export interface AppSettings {
  // Theme & UI
  themeMode: 'light' | 'dark' | 'system';
  viewMode: 'list' | 'grid' | 'compact';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Notes
  defaultCategory: string;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  showLineNumbers: boolean;
  wordWrap: boolean;
  
  // AI Settings
  defaultModel: string;
  aiEnabled: boolean;
  autoEnhance: boolean;
  autoCategroize: boolean;
  streamResponses: boolean;
  
  // Privacy & Security
  biometricAuth: boolean;
  autoLock: boolean;
  autoLockTimeout: number; // minutes
  encryptNotes: boolean;
  
  // Sync & Backup
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  cloudSync: boolean;
  
  // Performance
  maxCacheSize: number; // MB
  preloadImages: boolean;
  reducedAnimations: boolean;
  
  // Notifications
  enableNotifications: boolean;
  reminderNotifications: boolean;
  aiTaskNotifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  viewMode: 'list',
  fontSize: 'medium',
  compactMode: false,
  
  defaultCategory: 'Personal',
  autoSave: true,
  autoSaveInterval: 30,
  showLineNumbers: false,
  wordWrap: true,
  
  defaultModel: '',
  aiEnabled: true,
  autoEnhance: false,
  autoCategroize: true,
  streamResponses: true,
  
  biometricAuth: false,
  autoLock: false,
  autoLockTimeout: 5,
  encryptNotes: false,
  
  autoBackup: true,
  backupFrequency: 'weekly',
  cloudSync: false,
  
  maxCacheSize: 100,
  preloadImages: true,
  reducedAnimations: false,
  
  enableNotifications: true,
  reminderNotifications: true,
  aiTaskNotifications: true,
};

class SettingsStore {
  @observable settings: AppSettings = { ...DEFAULT_SETTINGS };
  @observable isLoading = false;
  @observable hasUnsavedChanges = false;

  constructor() {
    makeObservable(this);
  }

  async initialize() {
    this.isLoading = true;
    try {
      await this.loadSettings();
      console.log('⚙️ Settings Store initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Settings Store:', error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  private async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem('app_settings');
      if (settingsJson) {
        const loadedSettings = JSON.parse(settingsJson);
        this.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
      }
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  @action
  async saveSettings() {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      this.hasUnsavedChanges = false;
      console.log('💾 Settings saved');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  @action
  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.settings[key] = value;
    this.hasUnsavedChanges = true;
  }

  @action
  async updateAndSave<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.updateSetting(key, value);
    await this.saveSettings();
  }

  @action
  async resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    console.log('🔄 Settings reset to defaults');
  }

  @action
  async resetSection(section: 'ui' | 'notes' | 'ai' | 'security' | 'sync' | 'performance' | 'notifications') {
    const defaultSettings = { ...DEFAULT_SETTINGS };
    
    switch (section) {
      case 'ui':
        this.settings.themeMode = defaultSettings.themeMode;
        this.settings.viewMode = defaultSettings.viewMode;
        this.settings.fontSize = defaultSettings.fontSize;
        this.settings.compactMode = defaultSettings.compactMode;
        break;
        
      case 'notes':
        this.settings.defaultCategory = defaultSettings.defaultCategory;
        this.settings.autoSave = defaultSettings.autoSave;
        this.settings.autoSaveInterval = defaultSettings.autoSaveInterval;
        this.settings.showLineNumbers = defaultSettings.showLineNumbers;
        this.settings.wordWrap = defaultSettings.wordWrap;
        break;
        
      case 'ai':
        this.settings.defaultModel = defaultSettings.defaultModel;
        this.settings.aiEnabled = defaultSettings.aiEnabled;
        this.settings.autoEnhance = defaultSettings.autoEnhance;
        this.settings.autoCategroize = defaultSettings.autoCategroize;
        this.settings.streamResponses = defaultSettings.streamResponses;
        break;
        
      case 'security':
        this.settings.biometricAuth = defaultSettings.biometricAuth;
        this.settings.autoLock = defaultSettings.autoLock;
        this.settings.autoLockTimeout = defaultSettings.autoLockTimeout;
        this.settings.encryptNotes = defaultSettings.encryptNotes;
        break;
        
      case 'sync':
        this.settings.autoBackup = defaultSettings.autoBackup;
        this.settings.backupFrequency = defaultSettings.backupFrequency;
        this.settings.cloudSync = defaultSettings.cloudSync;
        break;
        
      case 'performance':
        this.settings.maxCacheSize = defaultSettings.maxCacheSize;
        this.settings.preloadImages = defaultSettings.preloadImages;
        this.settings.reducedAnimations = defaultSettings.reducedAnimations;
        break;
        
      case 'notifications':
        this.settings.enableNotifications = defaultSettings.enableNotifications;
        this.settings.reminderNotifications = defaultSettings.reminderNotifications;
        this.settings.aiTaskNotifications = defaultSettings.aiTaskNotifications;
        break;
    }
    
    await this.saveSettings();
    console.log(`🔄 Reset ${section} settings to defaults`);
  }

  // Computed getters for easy access
  @computed get isDarkMode() {
    return this.settings.themeMode === 'dark';
  }

  @computed get isSystemTheme() {
    return this.settings.themeMode === 'system';
  }

  @computed get isAIEnabled() {
    return this.settings.aiEnabled;
  }

  @computed get shouldAutoSave() {
    return this.settings.autoSave;
  }

  @computed get autoSaveIntervalMs() {
    return this.settings.autoSaveInterval * 1000;
  }

  @computed get autoLockTimeoutMs() {
    return this.settings.autoLockTimeout * 60 * 1000;
  }

  @computed get maxCacheSizeBytes() {
    return this.settings.maxCacheSize * 1024 * 1024;
  }

  // Generic getter for any setting
  get<K extends keyof AppSettings>(key: K, defaultValue?: AppSettings[K]): AppSettings[K] {
    return this.settings[key] ?? defaultValue ?? DEFAULT_SETTINGS[key];
  }

  // Export/Import settings
  async exportSettings(): Promise<string> {
    return JSON.stringify(this.settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate imported settings
      const validatedSettings: Partial<AppSettings> = {};
      
      for (const [key, value] of Object.entries(importedSettings)) {
        if (key in DEFAULT_SETTINGS && typeof value === typeof DEFAULT_SETTINGS[key as keyof AppSettings]) {
          validatedSettings[key as keyof AppSettings] = value;
        }
      }
      
      this.settings = { ...DEFAULT_SETTINGS, ...validatedSettings };
      await this.saveSettings();
      
      console.log('📥 Settings imported successfully');
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      throw new Error('Invalid settings format');
    }
  }

  // Secure settings management (for sensitive data)
  async setSecureSetting(key: string, value: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (error) {
      console.error(`❌ Failed to set secure setting ${key}:`, error);
      throw error;
    }
  }

  async getSecureSetting(key: string): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem(key);
    } catch (error) {
      console.error(`❌ Failed to get secure setting ${key}:`, error);
      return null;
    }
  }

  async removeSecureSetting(key: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Failed to remove secure setting ${key}:`, error);
      throw error;
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      // Clear various caches
      await AsyncStorage.multiRemove([
        'image_cache',
        'model_cache',
        'temp_data'
      ]);
      
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  // Reset method for store cleanup
  @action
  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.isLoading = false;
    this.hasUnsavedChanges = false;
  }

  // Get app info for debugging
  @computed get debugInfo() {
    return {
      settingsVersion: '1.0.0',
      hasUnsavedChanges: this.hasUnsavedChanges,
      settingsKeys: Object.keys(this.settings),
      lastModified: new Date().toISOString(),
    };
  }
}

export default SettingsStore;

