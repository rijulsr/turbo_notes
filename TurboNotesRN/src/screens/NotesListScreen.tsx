import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Card, 
  FAB, 
  Searchbar,
  Chip,
  useTheme 
} from 'react-native-paper';
import { observer } from 'mobx-react';
import { useNotesStore, useUIStore } from '../stores/RootStore';

const NotesListScreen = observer(() => {
  const notesStore = useNotesStore();
  const uiStore = useUIStore();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = React.useState('');

  const handleCreateNote = () => {
    uiStore.showNoteEditor('create');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search notes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
      />
      
      <View style={styles.categoryChips}>
        {notesStore.categories.map((category) => (
          <Chip
            key={category}
            selected={notesStore.selectedCategory === category}
            onPress={() => notesStore.setSelectedCategory(category)}
            style={styles.chip}
          >
            {category}
          </Chip>
        ))}
      </View>

      <View style={styles.content}>
        {notesStore.filteredNotes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                🚀 Welcome to Turbo Notes!
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Your AI-powered note-taking app with local LLM support is ready.
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                • Create notes with AI assistance
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                • Enhance notes with local AI models
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                • Categorize and organize automatically
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                • Chat with AI about your notes
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Text variant="bodyLarge">
            {notesStore.filteredNotes.length} notes found
          </Text>
        )}
      </View>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateNote}
        label="New Note"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    margin: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default NotesListScreen;
