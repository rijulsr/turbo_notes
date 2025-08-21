import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Modal,
} from 'react-native';
import modelManager from './src/services/ModelManager';
import EnhancedModelManagerScreen from './src/screens/EnhancedModelManagerScreen';
import ImprovedAITestScreen from './src/screens/ImprovedAITestScreen';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  category: string;
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showModelManager, setShowModelManager] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  };

  const textStyle = {
    color: isDarkMode ? '#ffffff' : '#000000',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    borderColor: isDarkMode ? '#404040' : '#e0e0e0',
  };

  // Theme object for Enhanced Model Manager
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    primary: '#007AFF',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#999999' : '#666666',
    border: isDarkMode ? '#404040' : '#e0e0e0',
    error: '#FF3B30',
    accent: '#FF9500',
  };

  useEffect(() => {
    // Check for active model on startup
    const checkActiveModel = async () => {
      const model = modelManager.getActiveModel();
      setActiveModel(model);
    };
    
    checkActiveModel();
    
    // Add model listener
    const listener = {
      onModelLoaded: (model) => {
        setActiveModel(model);
      },
      onModelUnloaded: () => {
        setActiveModel(null);
      }
    };
    
    modelManager.addModelListener(listener);
    
    return () => {
      modelManager.removeModelListener(listener);
    };
  }, []);

  const createNote = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date(),
      category: 'General',
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setIsEditing(false);
    Alert.alert('Success', 'Note created successfully!');
  };

  const editNote = (note: Note) => {
    setCurrentNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };

  const updateNote = () => {
    if (!currentNote || !title.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === currentNote.id
        ? { ...note, title: title.trim(), content: content.trim() }
        : note
    );

    setNotes(updatedNotes);
    setCurrentNote(null);
    setTitle('');
    setContent('');
    setIsEditing(false);
    Alert.alert('Success', 'Note updated successfully!');
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotes(notes.filter(note => note.id !== id));
            if (currentNote?.id === id) {
              setCurrentNote(null);
              setTitle('');
              setContent('');
              setIsEditing(false);
            }
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    setCurrentNote(null);
    setTitle('');
    setContent('');
    setIsEditing(false);
  };

  // Real AI functions using modelManager
  const summarizeNote = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content to summarize');
      return;
    }

    if (!activeModel) {
      Alert.alert('No AI Model', 'Please download and load an AI model first from the Model Manager.');
      return;
    }

    setAiProcessing(true);
    
    try {
      const prompt = `Please provide a concise summary of the following text in 2-3 sentences:

${content}

Summary:`;

      const summary = await modelManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.3,
      });

      Alert.alert('AI Summary', `📝 ${summary}`);
    } catch (error) {
      console.error('Summarization failed:', error);
      Alert.alert('AI Error', 'Failed to generate summary. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  const enhanceNote = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content to enhance');
      return;
    }

    if (!activeModel) {
      Alert.alert('No AI Model', 'Please download and load an AI model first from the Model Manager.');
      return;
    }

    setAiProcessing(true);
    
    try {
      const prompt = `Please enhance and expand the following note with relevant details, suggestions, and structure:

${content}

Enhanced version:`;

      const enhanced = await modelManager.generateText(prompt, {
        maxTokens: 400,
        temperature: 0.6,
      });

      setContent(content + '\n\n' + enhanced);
      Alert.alert('Success', 'Note enhanced with AI suggestions!');
    } catch (error) {
      console.error('Enhancement failed:', error);
      Alert.alert('AI Error', 'Failed to enhance note. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  const categorizeNote = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content to categorize');
      return;
    }

    if (!activeModel) {
      Alert.alert('No AI Model', 'Please download and load an AI model first from the Model Manager.');
      return;
    }

    setAiProcessing(true);
    
    try {
      const prompt = `Analyze the following text and categorize it into one of these categories: Work, Personal, Shopping, Travel, Health, Finance, Education, Ideas, Tasks, Reference.

Text: ${content}

Category:`;

      const category = await modelManager.generateText(prompt, {
        maxTokens: 50,
        temperature: 0.2,
      });

      Alert.alert('AI Categorization', `🏷️ Suggested Category: ${category.trim()}`);
    } catch (error) {
      console.error('Categorization failed:', error);
      Alert.alert('AI Error', 'Failed to categorize note. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, textStyle]}>
              🚀 Turbo Notes RN
            </Text>
            <Text style={[styles.headerSubtitle, textStyle]}>
              AI-Powered Note Taking with Local LLMs
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.modelManagerButton, { backgroundColor: '#6366f1' }]}
              onPress={() => setShowModelManager(true)}
            >
              <Text style={styles.modelManagerButtonText}>🤖 Models</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modelManagerButton, { backgroundColor: '#10b981' }]}
              onPress={() => setShowAITest(true)}
            >
              <Text style={styles.modelManagerButtonText}>🧪 Test AI</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* AI Status */}
        <View style={[styles.aiStatus, { backgroundColor: cardStyle.backgroundColor }]}>
          <Text style={[styles.aiStatusText, textStyle]}>
            🤖 AI Status: {activeModel ? `✅ ${activeModel.name}` : '❌ No model loaded'}
          </Text>
          {aiProcessing && (
            <Text style={[styles.aiProcessingText, { color: '#6366f1' }]}>
              🔄 Processing...
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Note Editor */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.cardTitle, textStyle]}>
            {isEditing ? '✏️ Edit Note' : '📝 Create New Note'}
          </Text>
          
          <TextInput
            style={[styles.input, cardStyle, textStyle]}
            placeholder="Note title..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.textArea, cardStyle, textStyle]}
            placeholder="Write your note here..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

          {/* AI Buttons */}
          <View style={styles.aiButtons}>
            <TouchableOpacity 
              style={[styles.aiButton, { opacity: aiProcessing ? 0.5 : 1 }]} 
              onPress={summarizeNote}
              disabled={aiProcessing}
            >
              <Text style={styles.aiButtonText}>📝 Summarize</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.aiButton, { opacity: aiProcessing ? 0.5 : 1 }]} 
              onPress={enhanceNote}
              disabled={aiProcessing}
            >
              <Text style={styles.aiButtonText}>✨ Enhance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.aiButton, { opacity: aiProcessing ? 0.5 : 1 }]} 
              onPress={categorizeNote}
              disabled={aiProcessing}
            >
              <Text style={styles.aiButtonText}>🏷️ Categorize</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={updateNote}>
                  <Text style={styles.buttonText}>Update Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={cancelEdit}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={createNote}>
                <Text style={styles.buttonText}>Create Note</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notes List */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.cardTitle, textStyle]}>
            📚 My Notes ({notes.length})
          </Text>
          
          {notes.length === 0 ? (
            <Text style={[styles.emptyText, textStyle]}>
              No notes yet. Create your first note above!
            </Text>
          ) : (
            notes.map((note) => (
              <View key={note.id} style={[styles.noteItem, cardStyle]}>
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteTitle, textStyle]}>{note.title}</Text>
                  <Text style={[styles.noteDate, textStyle]}>
                    {note.createdAt.toLocaleDateString()}
                  </Text>
                </View>
                
                <Text style={[styles.noteContent, textStyle]} numberOfLines={2}>
                  {note.content || 'No content'}
                </Text>
                
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => editNote(note)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNote(note.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* App Info */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.cardTitle, textStyle]}>
            🤖 AI Features (Demo)
          </Text>
          <Text style={[styles.infoText, textStyle]}>
            • Note Summarization with AI
          </Text>
          <Text style={[styles.infoText, textStyle]}>
            • Content Enhancement
          </Text>
          <Text style={[styles.infoText, textStyle]}>
            • Auto-Categorization
          </Text>
          <Text style={[styles.infoText, textStyle]}>
            • React Native 0.76.3
          </Text>
          <Text style={[styles.infoText, textStyle]}>
            • Local LLM integration with llama.rn
          </Text>
        </View>
      </ScrollView>

      {/* Model Manager Modal */}
      <Modal
        visible={showModelManager}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowModelManager(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: cardStyle.backgroundColor, borderBottomColor: cardStyle.borderColor }]}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: '#ef4444' }]}
              onPress={() => setShowModelManager(false)}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <EnhancedModelManagerScreen theme={theme} />
        </View>
      </Modal>

      {/* AI Test Modal */}
      <Modal
        visible={showAITest}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAITest(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: cardStyle.backgroundColor, borderBottomColor: cardStyle.borderColor }]}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: '#ef4444' }]}
              onPress={() => setShowAITest(false)}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ImprovedAITestScreen />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  modelManagerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modelManagerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  aiStatus: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aiProcessingText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  aiButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  aiButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  aiButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
    padding: 20,
  },
  noteItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  noteContent: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'flex-end',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default App;