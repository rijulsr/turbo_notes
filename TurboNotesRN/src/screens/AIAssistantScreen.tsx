import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { observer } from 'mobx-react';
import { useAIService, useUIStore } from '../stores/RootStore';

const AIAssistantScreen = observer(() => {
  const aiService = useAIService();
  const uiStore = useUIStore();
  const theme = useTheme();

  const handleLoadModel = async () => {
    try {
      uiStore.setLoading(true, 'Loading AI model...');
      // In a real implementation, you'd load an actual model
      await new Promise(resolve => setTimeout(resolve, 2000));
      uiStore.showSuccessToast('AI model loaded successfully!');
    } catch (error) {
      uiStore.showErrorToast('Failed to load AI model');
    } finally {
      uiStore.setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            🤖 AI Assistant
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            Your local AI assistant powered by llama.rn
          </Text>

          <View style={styles.statusContainer}>
            <Text variant="bodyMedium">
              Status: {aiService.isReady ? '✅ Ready' : '⏳ Not loaded'}
            </Text>
            
            {aiService.currentModel && (
              <Text variant="bodyMedium">
                Model: {aiService.currentModel.name}
              </Text>
            )}
          </View>

          <View style={styles.features}>
            <Text variant="titleMedium" style={styles.featuresTitle}>
              Features Available:
            </Text>
            <Text variant="bodyMedium">• Note Summarization</Text>
            <Text variant="bodyMedium">• Content Enhancement</Text>
            <Text variant="bodyMedium">• Auto-Categorization</Text>
            <Text variant="bodyMedium">• Chat with AI</Text>
            <Text variant="bodyMedium">• Local Processing (Privacy-First)</Text>
          </View>

          <Button 
            mode="contained" 
            onPress={handleLoadModel}
            style={styles.button}
            disabled={uiStore.isLoading}
          >
            {uiStore.isLoading ? 'Loading...' : 'Load AI Model'}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  statusContainer: {
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
});

export default AIAssistantScreen;

