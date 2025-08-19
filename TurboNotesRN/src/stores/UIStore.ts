import { makeObservable, observable, action, computed } from 'mobx';
import { Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsStore from './SettingsStore';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ViewMode = 'list' | 'grid' | 'compact';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

class UIStore {
  @observable isDarkMode = false;
  @observable themeMode: ThemeMode = 'system';
  @observable viewMode: ViewMode = 'list';
  @observable isDrawerOpen = false;
  @observable activeScreen = 'Notes';
  @observable screenDimensions = Dimensions.get('screen');
  @observable windowDimensions = Dimensions.get('window');
  @observable isKeyboardVisible = false;
  @observable keyboardHeight = 0;
  @observable toasts: ToastMessage[] = [];
  @observable isLoading = false;
  @observable loadingMessage = '';
  @observable isOnline = true;

  // AI-related UI state
  @observable aiStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  @observable aiLoadingProgress = 0;
  @observable activeAITask: string | null = null;

  // Note editor state
  @observable isNoteEditorVisible = false;
  @observable noteEditorMode: 'create' | 'edit' = 'create';

  // Chat UI state
  @observable isChatVisible = false;
  @observable chatInputHeight = 40;

  constructor() {
    makeObservable(this);
    this.setupDimensionListeners();
  }

  async initialize(settingsStore: SettingsStore) {
    try {
      // Load UI preferences from settings
      this.themeMode = await settingsStore.get('themeMode', 'system') as ThemeMode;
      this.viewMode = await settingsStore.get('viewMode', 'list') as ViewMode;
      
      // Set initial dark mode based on theme
      this.updateDarkMode();
      
      console.log('🎨 UI Store initialized');
    } catch (error) {
      console.error('❌ Failed to initialize UI Store:', error);
    }
  }

  @computed
  get isTablet(): boolean {
    const { width, height } = this.screenDimensions;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return Math.min(width, height) >= 600 && aspectRatio < 1.6;
  }

  @computed
  get isLandscape(): boolean {
    return this.windowDimensions.width > this.windowDimensions.height;
  }

  @computed
  get safeAreaInsets() {
    // This would be provided by react-native-safe-area-context in real usage
    return {
      top: Platform.OS === 'ios' ? 44 : 24,
      bottom: Platform.OS === 'ios' ? 34 : 0,
      left: 0,
      right: 0,
    };
  }

  private setupDimensionListeners() {
    const subscription = Dimensions.addEventListener('change', ({ screen, window }) => {
      this.setDimensions(screen, window);
    });

    // Cleanup would be handled in component unmount
    return () => subscription?.remove();
  }

  @action
  setDimensions(screen: typeof this.screenDimensions, window: typeof this.windowDimensions) {
    this.screenDimensions = screen;
    this.windowDimensions = window;
  }

  @action
  setThemeMode(mode: ThemeMode) {
    this.themeMode = mode;
    this.updateDarkMode();
    AsyncStorage.setItem('themeMode', mode);
  }

  @action
  private updateDarkMode() {
    if (this.themeMode === 'system') {
      // In a real app, you'd use react-native-appearance or similar
      this.isDarkMode = false; // Default to light for now
    } else {
      this.isDarkMode = this.themeMode === 'dark';
    }
  }

  @action
  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    AsyncStorage.setItem('viewMode', mode);
  }

  @action
  setDrawerOpen(isOpen: boolean) {
    this.isDrawerOpen = isOpen;
  }

  @action
  setActiveScreen(screen: string) {
    this.activeScreen = screen;
  }

  @action
  setKeyboardVisible(isVisible: boolean, height: number = 0) {
    this.isKeyboardVisible = isVisible;
    this.keyboardHeight = height;
  }

  @action
  setLoading(isLoading: boolean, message: string = '') {
    this.isLoading = isLoading;
    this.loadingMessage = message;
  }

  @action
  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  // AI-related actions
  @action
  setAIStatus(status: typeof this.aiStatus, progress: number = 0) {
    this.aiStatus = status;
    this.aiLoadingProgress = progress;
  }

  @action
  setActiveAITask(taskId: string | null) {
    this.activeAITask = taskId;
  }

  // Note editor actions
  @action
  showNoteEditor(mode: 'create' | 'edit' = 'create') {
    this.isNoteEditorVisible = true;
    this.noteEditorMode = mode;
  }

  @action
  hideNoteEditor() {
    this.isNoteEditorVisible = false;
  }

  // Chat actions
  @action
  showChat() {
    this.isChatVisible = true;
  }

  @action
  hideChat() {
    this.isChatVisible = false;
  }

  @action
  setChatInputHeight(height: number) {
    this.chatInputHeight = Math.max(40, Math.min(height, 120));
  }

  // Toast/Snackbar management
  @action
  showToast(
    message: string,
    type: ToastMessage['type'] = 'info',
    duration: number = 4000,
    action?: ToastMessage['action']
  ): string {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration,
      action,
    };

    this.toasts.push(toast);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }

    return id;
  }

  @action
  dismissToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  @action
  clearAllToasts() {
    this.toasts = [];
  }

  // Utility methods
  showSuccessToast(message: string, action?: ToastMessage['action']) {
    return this.showToast(message, 'success', 3000, action);
  }

  showErrorToast(message: string, action?: ToastMessage['action']) {
    return this.showToast(message, 'error', 5000, action);
  }

  showWarningToast(message: string, action?: ToastMessage['action']) {
    return this.showToast(message, 'warning', 4000, action);
  }

  showInfoToast(message: string, action?: ToastMessage['action']) {
    return this.showToast(message, 'info', 4000, action);
  }

  // Reset to initial state
  @action
  reset() {
    this.isDarkMode = false;
    this.themeMode = 'system';
    this.viewMode = 'list';
    this.isDrawerOpen = false;
    this.activeScreen = 'Notes';
    this.isKeyboardVisible = false;
    this.keyboardHeight = 0;
    this.toasts = [];
    this.isLoading = false;
    this.loadingMessage = '';
    this.aiStatus = 'idle';
    this.aiLoadingProgress = 0;
    this.activeAITask = null;
    this.isNoteEditorVisible = false;
    this.isChatVisible = false;
    this.chatInputHeight = 40;
  }

  // Haptic feedback helper
  triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    // This would use react-native-haptic-feedback in real implementation
    console.log(`🔄 Haptic feedback: ${type}`);
  }

  // Animation helpers
  @computed
  get animationDuration() {
    return this.isTablet ? 300 : 250;
  }

  @computed
  get layoutAnimationConfig() {
    return {
      duration: this.animationDuration,
      update: {
        type: 'easeInEaseOut',
      },
      delete: {
        type: 'easeInEaseOut',
        property: 'opacity',
      },
    };
  }
}

export default UIStore;
