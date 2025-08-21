/**
 * Model Settings Modal
 * Advanced configuration UI for chat templates, completion parameters,
 * and model-specific settings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Text,
  Switch,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Modal, Card, Button, Divider, Chip } from 'react-native-paper';
import { observer } from 'mobx-react';
import { enhancedModelManager, LocalModel, ModelSettings, ChatTemplate } from '../services/EnhancedModelManager';

interface ModelSettingsModalProps {
  visible: boolean;
  model: LocalModel | null;
  onClose: () => void;
  theme: any;
}

export const ModelSettingsModal = observer(({
  visible,
  model,
  onClose,
  theme
}: ModelSettingsModalProps) => {
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'completion' | 'context'>('chat');

  useEffect(() => {
    if (model && visible) {
      const modelSettings = enhancedModelManager.getModelSettings(model.id);
      setSettings(modelSettings);
      setSelectedTemplate(modelSettings.chatTemplate || '');
      setSystemPrompt(modelSettings.systemPrompt || '');
    }
  }, [model, visible]);

  const handleSave = async () => {
    if (!model || !settings) return;

    try {
      const updatedSettings = {
        ...settings,
        chatTemplate: selectedTemplate,
        systemPrompt: systemPrompt
      };

      await enhancedModelManager.updateModelSettings(model.id, updatedSettings);
      Alert.alert('Success', 'Model settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save model settings');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (model) {
              // Reset to defaults
              const defaultSettings = enhancedModelManager.getModelSettings('__default__');
              setSettings(defaultSettings);
              setSelectedTemplate('');
              setSystemPrompt('');
            }
          }
        }
      ]
    );
  };

  const updateCompletionParam = (key: string, value: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      completionParams: {
        ...settings.completionParams,
        [key]: value
      }
    });
  };

  const updateContextParam = (key: string, value: number | boolean) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      contextParams: {
        ...settings.contextParams,
        [key]: value
      }
    });
  };

  const renderChatSettings = () => {
    const templates = enhancedModelManager.getChatTemplates();
    
    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Chat Template
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Choose how the model formats conversation messages
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          <TouchableOpacity
            style={[
              styles.templateChip,
              !selectedTemplate && styles.templateChipSelected,
              { backgroundColor: !selectedTemplate ? theme.primary : theme.surface }
            ]}
            onPress={() => setSelectedTemplate('')}
          >
            <Text style={[
              styles.templateChipText,
              { color: !selectedTemplate ? 'white' : theme.text }
            ]}>
              Auto
            </Text>
          </TouchableOpacity>
          
          {templates.map((template) => (
            <TouchableOpacity
              key={template.name}
              style={[
                styles.templateChip,
                selectedTemplate === template.name && styles.templateChipSelected,
                { backgroundColor: selectedTemplate === template.name ? theme.primary : theme.surface }
              ]}
              onPress={() => setSelectedTemplate(template.name)}
            >
              <Text style={[
                styles.templateChipText,
                { color: selectedTemplate === template.name ? 'white' : theme.text }
              ]}>
                {template.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedTemplate && (
          <View style={styles.templatePreview}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Template Preview
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: theme.background }]}>
              <Text style={[styles.codeText, { color: theme.textSecondary }]}>
                {templates.find(t => t.name === selectedTemplate)?.template}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          System Prompt
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Default system message for this model
        </Text>
        
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border
          }]}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="You are a helpful AI assistant..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
    );
  };

  const renderCompletionSettings = () => {
    if (!settings) return null;

    const { completionParams } = settings;

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Generation Parameters
        </Text>
        
        {/* Temperature */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Temperature
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {completionParams.temperature.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Controls randomness (0.1 = focused, 1.0 = creative)
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0.1</Text>
            <View style={styles.slider}>
              {/* Custom slider implementation would go here */}
              <TextInput
                style={[styles.parameterInput, { 
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border
                }]}
                value={completionParams.temperature.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0.7;
                  updateCompletionParam('temperature', Math.max(0.1, Math.min(2.0, value)));
                }}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>2.0</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Top-P */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Top-P (Nucleus Sampling)
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {completionParams.top_p.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Probability threshold for token selection
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0.1</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={completionParams.top_p.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0.9;
                updateCompletionParam('top_p', Math.max(0.1, Math.min(1.0, value)));
              }}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>1.0</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Top-K */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Top-K
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {completionParams.top_k}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Number of top tokens to consider (0 = disabled)
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={completionParams.top_k.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 40;
                updateCompletionParam('top_k', Math.max(0, Math.min(100, value)));
              }}
              keyboardType="number-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>100</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Max Tokens */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Max Tokens
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {completionParams.n_predict}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Maximum number of tokens to generate
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>50</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={completionParams.n_predict.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 512;
                updateCompletionParam('n_predict', Math.max(50, Math.min(2048, value)));
              }}
              keyboardType="number-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>2048</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Repetition Penalty */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Repetition Penalty
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {completionParams.penalty_repeat.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Penalty for repeating tokens (1.0 = no penalty)
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>1.0</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={completionParams.penalty_repeat.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 1.1;
                updateCompletionParam('penalty_repeat', Math.max(1.0, Math.min(1.5, value)));
              }}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>1.5</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContextSettings = () => {
    if (!settings) return null;

    const { contextParams } = settings;

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Context & Performance
        </Text>
        
        {/* Context Size */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Context Size
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {contextParams.n_ctx}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Maximum context length in tokens
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>512</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={contextParams.n_ctx.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 4096;
                updateContextParam('n_ctx', Math.max(512, Math.min(32768, value)));
              }}
              keyboardType="number-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>32k</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Batch Size */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Batch Size
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {contextParams.n_batch}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Number of tokens processed in parallel
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>128</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={contextParams.n_batch.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 512;
                updateContextParam('n_batch', Math.max(128, Math.min(2048, value)));
              }}
              keyboardType="number-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>2048</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* GPU Layers */}
        <View style={styles.parameterRow}>
          <View style={styles.parameterHeader}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              GPU Layers
            </Text>
            <Text style={[styles.parameterValue, { color: theme.primary }]}>
              {contextParams.n_gpu_layers}
            </Text>
          </View>
          <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
            Number of layers to run on GPU (0 = CPU only)
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>0</Text>
            <TextInput
              style={[styles.parameterInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={contextParams.n_gpu_layers.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                updateContextParam('n_gpu_layers', Math.max(0, Math.min(50, value)));
              }}
              keyboardType="number-pad"
            />
            <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>50</Text>
          </View>
        </View>

        <Divider style={{ backgroundColor: theme.border, marginVertical: 16 }} />

        {/* Advanced Options */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Advanced Options
        </Text>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Memory Lock
            </Text>
            <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
              Prevent model from being swapped to disk
            </Text>
          </View>
          <Switch
            value={contextParams.use_mlock}
            onValueChange={(value) => updateContextParam('use_mlock', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={contextParams.use_mlock ? 'white' : theme.textSecondary}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={[styles.parameterLabel, { color: theme.text }]}>
              Flash Attention
            </Text>
            <Text style={[styles.parameterDescription, { color: theme.textSecondary }]}>
              Use optimized attention mechanism (experimental)
            </Text>
          </View>
          <Switch
            value={contextParams.flash_attn}
            onValueChange={(value) => updateContextParam('flash_attn', value)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={contextParams.flash_attn ? 'white' : theme.textSecondary}
          />
        </View>
      </View>
    );
  };

  if (!model || !settings) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.surface }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Model Settings
        </Text>
        <Text style={[styles.modelName, { color: theme.textSecondary }]}>
          {model.name}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { key: 'chat', label: 'Chat' },
          { key: 'completion', label: 'Generation' },
          { key: 'context', label: 'Performance' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
              { backgroundColor: activeTab === tab.key ? theme.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? 'white' : theme.text }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'chat' && renderChatSettings()}
        {activeTab === 'completion' && renderCompletionSettings()}
        {activeTab === 'context' && renderContextSettings()}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleReset}
          style={[styles.actionButton, { borderColor: theme.border }]}
          labelStyle={{ color: theme.text }}
        >
          Reset
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
        >
          Save
        </Button>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelName: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeTab: {
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    maxHeight: 400,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  templateScroll: {
    marginBottom: 16,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    elevation: 1,
  },
  templateChipSelected: {
    elevation: 3,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  templatePreview: {
    marginBottom: 16,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  parameterRow: {
    marginBottom: 16,
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  parameterDescription: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 11,
    minWidth: 30,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  parameterInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ModelSettingsModal;
