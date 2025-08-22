import React, { useState } from 'react';
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
} from 'react-native';

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

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  };

  const textStyle = {
    color: isDarkMode ? '#ffffff' : '#000000',
  };

  const addNote = () => {
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
    Alert.alert('Success', 'Note added successfully!');
  };

  const editNote = (note: Note) => {
    setCurrentNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!currentNote || !title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const updatedNote = {
      ...currentNote,
      title: title.trim(),
      content: content.trim(),
    };

    const updatedNotes = notes.map(note =>
      note.id === currentNote.id ? updatedNote : note
    );

    setNotes(updatedNotes);
    setCurrentNote(null);
    setTitle('');
    setContent('');
    setIsEditing(false);
    Alert.alert('Success', 'Note updated successfully!');
  };

  const deleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotes(notes.filter(note => note.id !== noteId));
            if (currentNote?.id === noteId) {
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

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View style={styles.header}>
        <Text style={[styles.title, textStyle]}>📝 TurboNotes</Text>
        <Text style={[styles.subtitle, textStyle]}>
          Simple & Fast Note Taking
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Add/Edit Note Form */}
        <View style={[styles.noteForm, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}>
          <Text style={[styles.sectionTitle, textStyle]}>
            {isEditing ? 'Edit Note' : 'Add New Note'}
          </Text>
          
          <TextInput
            style={[styles.input, textStyle, { backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff' }]}
            placeholder="Note title..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.textArea, textStyle, { backgroundColor: isDarkMode ? '#3a3a3a' : '#ffffff' }]}
            placeholder="Write your note here..."
            placeholderTextColor={isDarkMode ? '#888' : '#666'}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={isEditing ? saveNote : addNote}
            >
              <Text style={styles.buttonText}>
                {isEditing ? '💾 Save Changes' : '➕ Add Note'}
              </Text>
            </TouchableOpacity>
            
            {isEditing && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setIsEditing(false);
                  setCurrentNote(null);
                  setTitle('');
                  setContent('');
                }}
              >
                <Text style={[styles.buttonText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notes List */}
        <View style={styles.notesSection}>
          <Text style={[styles.sectionTitle, textStyle]}>
            📋 Your Notes ({notes.length})
          </Text>
          
          {notes.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}>
              <Text style={[styles.emptyText, textStyle]}>
                No notes yet. Create your first note above! 👆
              </Text>
            </View>
          ) : (
            notes.map((note) => (
              <View
                key={note.id}
                style={[styles.noteCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5' }]}
              >
                <TouchableOpacity onPress={() => editNote(note)}>
                  <Text style={[styles.noteTitle, textStyle]}>{note.title}</Text>
                  <Text style={[styles.noteContent, textStyle]} numberOfLines={2}>
                    {note.content || 'No content'}
                  </Text>
                  <Text style={[styles.noteDate, { color: isDarkMode ? '#888' : '#666' }]}>
                    {note.createdAt.toLocaleDateString()} • {note.category}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => editNote(note)}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteNote(note.id)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noteForm: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notesSection: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
  },
});

export default App;