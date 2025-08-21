import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  useTheme,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { observer } from 'mobx-react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Stores
import { RootStore, RootStoreProvider } from '../stores/RootStore';
import database from '../database';

// Screens
import NotesListScreen from '../screens/NotesListScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import ModelManagerScreen from '../screens/ModelManagerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import ImportExportScreen from '../screens/ImportExportScreen';

// Components
import LoadingScreen from './LoadingScreen';
import CustomDrawerContent from './CustomDrawerContent';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  NoteEditor: { noteId?: string };
  Chat: { sessionId?: string };
  ModelManager: undefined;
  ImportExport: undefined;
};

export type MainTabParamList = {
  Notes: undefined;
  AIAssistant: undefined;
  Settings: undefined;
};

export type DrawerParamList = {
  Home: undefined;
  AIModels: undefined;
  ImportExport: undefined;
  Settings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Custom theme with AI-focused colors
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1', // Indigo
    primaryContainer: '#e0e7ff',
    secondary: '#8b5cf6', // Purple
    secondaryContainer: '#f3e8ff',
    tertiary: '#06b6d4', // Cyan
    tertiaryContainer: '#cffafe',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    background: '#fafafa',
    onBackground: '#0f172a',
    outline: '#cbd5e1',
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818cf8', // Light indigo
    primaryContainer: '#4338ca',
    secondary: '#a78bfa', // Light purple
    secondaryContainer: '#7c3aed',
    tertiary: '#22d3ee', // Light cyan
    tertiaryContainer: '#0891b2',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    background: '#0f172a',
    onBackground: '#f8fafc',
    outline: '#475569',
  },
};

// Bottom Tab Navigator
const TabNavigator = observer(() => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Notes':
              iconName = focused ? 'note' : 'note-outline';
              break;
            case 'AIAssistant':
              iconName = focused ? 'smart-toy' : 'smart-toy';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Notes" 
        component={NotesListScreen}
        options={{ title: 'My Notes' }}
      />
      <Tab.Screen 
        name="AIAssistant" 
        component={AIAssistantScreen}
        options={{ title: 'AI Assistant' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
});

// Main Stack Navigator
const StackNavigator = observer(() => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NoteEditor" 
        component={NoteEditorScreen}
        options={{ 
          title: 'Edit Note',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ 
          title: 'AI Chat',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ModelManager" 
        component={ModelManagerScreen}
        options={{ title: 'AI Models' }}
      />
      <Stack.Screen 
        name="ImportExport" 
        component={ImportExportScreen}
        options={{ title: 'Import & Export' }}
      />
    </Stack.Navigator>
  );
});

// Drawer Navigator (Main App Navigation)
const DrawerNavigator = observer(() => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={StackNavigator}
        options={{
          drawerLabel: 'Notes',
          drawerIcon: ({ color, size }) => (
            <Icon name="note" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="AIModels" 
        component={ModelManagerScreen}
        options={{
          drawerLabel: 'AI Models',
          drawerIcon: ({ color, size }) => (
            <Icon name="psychology" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="ImportExport" 
        component={ImportExportScreen}
        options={{
          drawerLabel: 'Import & Export',
          drawerIcon: ({ color, size }) => (
            <Icon name="import-export" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
});

// Main App Component
const App = observer(() => {
  const [rootStore, setRootStore] = useState<RootStore | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize root store with database
        const store = new RootStore(database);
        await store.initialize();
        setRootStore(store);
        
        console.log('🚀 Turbo Notes initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setSnackbarMessage('Failed to initialize app');
        setSnackbarVisible(true);
      }
    };

    initializeApp();
  }, []);

  if (!rootStore) {
    return <LoadingScreen message="Initializing Turbo Notes..." />;
  }

  const theme = isDarkMode ? customDarkTheme : customLightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <RootStoreProvider value={rootStore}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.surface}
            />
            <NavigationContainer theme={theme}>
              <DrawerNavigator />
            </NavigationContainer>
            
            <Portal>
              <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={4000}
                action={{
                  label: 'Dismiss',
                  onPress: () => setSnackbarVisible(false),
                }}
              >
                {snackbarMessage}
              </Snackbar>
            </Portal>
          </RootStoreProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

export default App;

