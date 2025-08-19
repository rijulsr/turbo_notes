import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  DrawerContentScrollView,
  DrawerContentComponentProps 
} from '@react-navigation/drawer';
import { 
  Text, 
  Drawer, 
  Avatar, 
  useTheme 
} from 'react-native-paper';
import { observer } from 'mobx-react';
import { useAIService } from '../stores/RootStore';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = observer((props) => {
  const theme = useTheme();
  const aiService = useAIService();

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.surface }}>
      <View style={styles.header}>
        <Avatar.Icon size={64} icon="note" />
        <Text variant="headlineSmall" style={styles.title}>
          Turbo Notes
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          AI-Powered Note Taking
        </Text>
      </View>

      <View style={styles.aiStatus}>
        <Text variant="bodyMedium">
          🤖 AI Status: {aiService.isReady ? '✅ Ready' : '⏳ Loading'}
        </Text>
        {aiService.currentModel && (
          <Text variant="bodySmall" style={styles.modelName}>
            Model: {aiService.currentModel.name}
          </Text>
        )}
      </View>

      <Drawer.Section>
        <Drawer.Item
          label="Notes"
          icon="note"
          active={props.state.index === 0}
          onPress={() => props.navigation.navigate('Home')}
        />
        
        <Drawer.Item
          label="AI Models"
          icon="psychology"
          active={props.state.index === 1}
          onPress={() => props.navigation.navigate('AIModels')}
        />
        
        <Drawer.Item
          label="Import & Export"
          icon="import-export"
          active={props.state.index === 2}
          onPress={() => props.navigation.navigate('ImportExport')}
        />
        
        <Drawer.Item
          label="Settings"
          icon="settings"
          active={props.state.index === 3}
          onPress={() => props.navigation.navigate('Settings')}
        />
      </Drawer.Section>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.version}>
          React Native + llama.rn
        </Text>
      </View>
    </DrawerContentScrollView>
  );
});

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  title: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  aiStatus: {
    padding: 16,
    marginBottom: 8,
  },
  modelName: {
    opacity: 0.6,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    marginTop: 'auto',
  },
  version: {
    textAlign: 'center',
    opacity: 0.5,
  },
});

export default CustomDrawerContent;
