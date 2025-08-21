import { makeObservable, observable, action, computed } from 'mobx';
import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { Note, NoteModel } from '../models/Note';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface NoteData {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
  aiGenerated: boolean;
  imageUrl?: string;
  attachments?: string[];
}

export type NoteSortBy = 'createdAt' | 'updatedAt' | 'title' | 'category';
export type NoteSortOrder = 'asc' | 'desc';

class NotesStore {
  @observable notes: Note[] = [];
  @observable selectedNote: Note | null = null;
  @observable isLoading = false;
  @observable searchQuery = '';
  @observable selectedCategory = 'all';
  @observable sortBy: NoteSortBy = 'updatedAt';
  @observable sortOrder: NoteSortOrder = 'desc';
  @observable showArchived = false;
  
  private database: Database;

  constructor(database: Database) {
    makeObservable(this);
    this.database = database;
    this.loadNotes();
  }

  @computed
  get filteredNotes(): Note[] {
    let filtered = this.notes.filter(note => {
      // Filter by archive status
      if (!this.showArchived && note.isArchived) return false;
      
      // Filter by category
      if (this.selectedCategory !== 'all' && note.category !== this.selectedCategory) {
        return false;
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pinned notes always come first
    const pinned = filtered.filter(note => note.isPinned);
    const unpinned = filtered.filter(note => !note.isPinned);
    
    return [...pinned, ...unpinned];
  }

  @computed
  get categories(): string[] {
    const categories = new Set(this.notes.map(note => note.category));
    return Array.from(categories).sort();
  }

  @computed
  get pinnedNotes(): Note[] {
    return this.notes.filter(note => note.isPinned && !note.isArchived);
  }

  @computed
  get recentNotes(): Note[] {
    return this.notes
      .filter(note => !note.isArchived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  }

  @action
  async loadNotes() {
    this.isLoading = true;
    try {
      const notesCollection = this.database.get<NoteModel>('notes');
      const noteRecords = await notesCollection.query().fetch();
      
      this.notes = noteRecords.map(record => ({
        id: record.id,
        title: record.title,
        content: record.content,
        category: record.category,
        tags: record.tags,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        isPinned: record.isPinned,
        isArchived: record.isArchived,
        aiGenerated: record.aiGenerated,
        imageUrl: record.imageUrl,
        attachments: record.attachments
      }));
      
      console.log(`📚 Loaded ${this.notes.length} notes`);
    } catch (error) {
      console.error('❌ Failed to load notes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async createNote(noteData: Partial<NoteData>): Promise<Note> {
    try {
      const now = new Date();
      const note: Note = {
        id: uuidv4(),
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        category: noteData.category || 'Personal',
        tags: noteData.tags || [],
        createdAt: now,
        updatedAt: now,
        isPinned: noteData.isPinned || false,
        isArchived: noteData.isArchived || false,
        aiGenerated: noteData.aiGenerated || false,
        imageUrl: noteData.imageUrl,
        attachments: noteData.attachments || []
      };

      // Save to database
      await this.database.write(async () => {
        const notesCollection = this.database.get<NoteModel>('notes');
        await notesCollection.create(noteRecord => {
          noteRecord.id = note.id;
          noteRecord.title = note.title;
          noteRecord.content = note.content;
          noteRecord.category = note.category;
          noteRecord.tags = note.tags;
          noteRecord.createdAt = note.createdAt;
          noteRecord.updatedAt = note.updatedAt;
          noteRecord.isPinned = note.isPinned;
          noteRecord.isArchived = note.isArchived;
          noteRecord.aiGenerated = note.aiGenerated;
          noteRecord.imageUrl = note.imageUrl;
          noteRecord.attachments = note.attachments;
        });
      });

      this.notes.unshift(note);
      console.log(`✅ Created note: ${note.title}`);
      
      return note;
    } catch (error) {
      console.error('❌ Failed to create note:', error);
      throw error;
    }
  }

  @action
  async updateNote(id: string, updates: Partial<NoteData>): Promise<void> {
    try {
      const noteIndex = this.notes.findIndex(note => note.id === id);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      const updatedNote = {
        ...this.notes[noteIndex],
        ...updates,
        updatedAt: new Date()
      };

      // Update in database
      await this.database.write(async () => {
        const notesCollection = this.database.get<NoteModel>('notes');
        const noteRecord = await notesCollection.find(id);
        await noteRecord.update(record => {
          if (updates.title !== undefined) record.title = updates.title;
          if (updates.content !== undefined) record.content = updates.content;
          if (updates.category !== undefined) record.category = updates.category;
          if (updates.tags !== undefined) record.tags = updates.tags;
          if (updates.isPinned !== undefined) record.isPinned = updates.isPinned;
          if (updates.isArchived !== undefined) record.isArchived = updates.isArchived;
          if (updates.aiGenerated !== undefined) record.aiGenerated = updates.aiGenerated;
          if (updates.imageUrl !== undefined) record.imageUrl = updates.imageUrl;
          if (updates.attachments !== undefined) record.attachments = updates.attachments;
          record.updatedAt = updatedNote.updatedAt;
        });
      });

      this.notes[noteIndex] = updatedNote;
      
      if (this.selectedNote?.id === id) {
        this.selectedNote = updatedNote;
      }

      console.log(`✅ Updated note: ${updatedNote.title}`);
    } catch (error) {
      console.error('❌ Failed to update note:', error);
      throw error;
    }
  }

  @action
  async deleteNote(id: string): Promise<void> {
    try {
      // Delete from database
      await this.database.write(async () => {
        const notesCollection = this.database.get<NoteModel>('notes');
        const noteRecord = await notesCollection.find(id);
        await noteRecord.destroyPermanently();
      });

      this.notes = this.notes.filter(note => note.id !== id);
      
      if (this.selectedNote?.id === id) {
        this.selectedNote = null;
      }

      console.log(`🗑️ Deleted note: ${id}`);
    } catch (error) {
      console.error('❌ Failed to delete note:', error);
      throw error;
    }
  }

  @action
  async togglePin(id: string): Promise<void> {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      await this.updateNote(id, { isPinned: !note.isPinned });
    }
  }

  @action
  async toggleArchive(id: string): Promise<void> {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      await this.updateNote(id, { isArchived: !note.isArchived });
    }
  }

  @action
  setSelectedNote(note: Note | null) {
    this.selectedNote = note;
  }

  @action
  setSearchQuery(query: string) {
    this.searchQuery = query;
  }

  @action
  setSelectedCategory(category: string) {
    this.selectedCategory = category;
  }

  @action
  setSorting(sortBy: NoteSortBy, sortOrder: NoteSortOrder) {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
  }

  @action
  setShowArchived(show: boolean) {
    this.showArchived = show;
  }

  // Bulk operations
  @action
  async bulkUpdateCategory(noteIds: string[], category: string): Promise<void> {
    try {
      await this.database.write(async () => {
        const notesCollection = this.database.get<NoteModel>('notes');
        const updates = noteIds.map(async id => {
          const noteRecord = await notesCollection.find(id);
          return noteRecord.update(record => {
            record.category = category;
            record.updatedAt = new Date();
          });
        });
        await Promise.all(updates);
      });

      // Update local state
      noteIds.forEach(id => {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
          this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            category,
            updatedAt: new Date()
          };
        }
      });

      console.log(`✅ Updated category for ${noteIds.length} notes`);
    } catch (error) {
      console.error('❌ Failed to bulk update category:', error);
      throw error;
    }
  }

  @action
  async bulkDelete(noteIds: string[]): Promise<void> {
    try {
      await this.database.write(async () => {
        const notesCollection = this.database.get<NoteModel>('notes');
        const deletions = noteIds.map(async id => {
          const noteRecord = await notesCollection.find(id);
          return noteRecord.destroyPermanently();
        });
        await Promise.all(deletions);
      });

      this.notes = this.notes.filter(note => !noteIds.includes(note.id));
      
      if (this.selectedNote && noteIds.includes(this.selectedNote.id)) {
        this.selectedNote = null;
      }

      console.log(`🗑️ Bulk deleted ${noteIds.length} notes`);
    } catch (error) {
      console.error('❌ Failed to bulk delete notes:', error);
      throw error;
    }
  }

  // Import/Export functionality
  async exportNotes(format: 'json' | 'markdown' | 'csv'): Promise<string> {
    const notes = this.filteredNotes;
    
    switch (format) {
      case 'json':
        return JSON.stringify(notes, null, 2);
        
      case 'markdown':
        return notes.map(note => 
          `# ${note.title}\n\n${note.content}\n\n---\n`
        ).join('\n');
        
      case 'csv':
        const headers = 'Title,Content,Category,Created,Updated\n';
        const rows = notes.map(note => 
          `"${note.title}","${note.content}","${note.category}","${note.createdAt.toISOString()}","${note.updatedAt.toISOString()}"`
        ).join('\n');
        return headers + rows;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importNotes(data: string, format: 'json' | 'markdown'): Promise<number> {
    let importedCount = 0;
    
    try {
      switch (format) {
        case 'json':
          const jsonNotes = JSON.parse(data) as NoteData[];
          for (const noteData of jsonNotes) {
            await this.createNote({
              ...noteData,
              id: uuidv4() // Generate new ID to avoid conflicts
            });
            importedCount++;
          }
          break;
          
        case 'markdown':
          // Simple markdown parsing - split by headers
          const sections = data.split(/^# /gm).filter(section => section.trim());
          for (const section of sections) {
            const lines = section.split('\n');
            const title = lines[0]?.trim();
            const content = lines.slice(1).join('\n').replace(/^---$/gm, '').trim();
            
            if (title && content) {
              await this.createNote({ title, content });
              importedCount++;
            }
          }
          break;
          
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
      
      console.log(`✅ Imported ${importedCount} notes`);
      return importedCount;
    } catch (error) {
      console.error('❌ Failed to import notes:', error);
      throw error;
    }
  }

  // Search functionality
  @action
  async searchNotes(query: string): Promise<Note[]> {
    if (!query.trim()) return this.filteredNotes;
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return this.notes.filter(note => {
      const searchableText = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Statistics
  @computed
  get statistics() {
    const total = this.notes.length;
    const archived = this.notes.filter(n => n.isArchived).length;
    const pinned = this.notes.filter(n => n.isPinned).length;
    const aiGenerated = this.notes.filter(n => n.aiGenerated).length;
    
    const categoryCounts: { [key: string]: number } = {};
    this.notes.forEach(note => {
      categoryCounts[note.category] = (categoryCounts[note.category] || 0) + 1;
    });
    
    return {
      total,
      active: total - archived,
      archived,
      pinned,
      aiGenerated,
      categories: categoryCounts
    };
  }
}

export default NotesStore;

