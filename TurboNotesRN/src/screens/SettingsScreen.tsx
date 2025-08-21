import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, Switch, useTheme } from 'react-native-paper';
import { observer } from 'mobx-react';
import { useSettingsStore } from '../stores/RootStore';

const SettingsScreen = observer(() => {
  const settingsStore = useSettingsStore();
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section>
        <List.Subheader>AI Settings</List.Subheader>
        
        <List.Item
          title="AI Assistance"
          description="Enable AI-powered features"
          right={() => (
            <Switch
              value={settingsStore.settings.aiEnabled}
              onValueChange={(value) => 
                settingsStore.updateAndSave('aiEnabled', value)
              }
            />
          )}
        />
        
        <List.Item
          title="Auto-Categorize"
          description="Automatically categorize notes with AI"
          right={() => (
            <Switch
              value={settingsStore.settings.autoCategroize}
              onValueChange={(value) => 
                settingsStore.updateAndSave('autoCategroize', value)
              }
            />
          )}
        />
        
        <List.Item
          title="Stream Responses"
          description="Show AI responses as they're generated"
          right={() => (
            <Switch
              value={settingsStore.settings.streamResponses}
              onValueChange={(value) => 
                settingsStore.updateAndSave('streamResponses', value)
              }
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Notes</List.Subheader>
        
        <List.Item
          title="Auto Save"
          description="Automatically save notes while typing"
          right={() => (
            <Switch
              value={settingsStore.settings.autoSave}
              onValueChange={(value) => 
                settingsStore.updateAndSave('autoSave', value)
              }
            />
          )}
        />
        
        <List.Item
          title="Word Wrap"
          description="Wrap long lines in editor"
          right={() => (
            <Switch
              value={settingsStore.settings.wordWrap}
              onValueChange={(value) => 
                settingsStore.updateAndSave('wordWrap', value)
              }
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>App Info</List.Subheader>
        
        <List.Item
          title="Version"
          description="1.0.0 - React Native + llama.rn"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        
        <List.Item
          title="Stack"
          description="React Native 0.76.3, MobX, WatermelonDB, llama.rn"
          left={(props) => <List.Icon {...props} icon="code-tags" />}
        />
      </List.Section>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;

