import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

class TurboNotesApp {
    private notes: Note[] = [];
    private currentEditingId: string | null = null;

    constructor() {
        this.init();
    }

    async init() {
        // Initialize Capacitor plugins
        if (Capacitor.isNativePlatform()) {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#000000' });
        }

        // Load existing notes
        await this.loadNotes();
        this.renderNotes();
        this.bindEvents();

        console.log('🚀 Turbo Notes Android initialized');
    }

    private bindEvents() {
        // Quick note input
        const quickNoteInput = document.getElementById('quickNote') as HTMLTextAreaElement;
        const saveQuickNoteBtn = document.getElementById('saveQuickNote') as HTMLButtonElement;

        quickNoteInput?.addEventListener('input', () => {
            const hasContent = quickNoteInput.value.trim().length > 0;
            saveQuickNoteBtn.disabled = !hasContent;
        });

        quickNoteInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.saveQuickNote();
            }
        });

        // Note editor
        const noteEditor = document.getElementById('noteEditor') as HTMLTextAreaElement;
        const saveNoteBtn = document.getElementById('saveNote') as HTMLButtonElement;

        noteEditor?.addEventListener('input', () => {
            const hasContent = noteEditor.value.trim().length > 0;
            saveNoteBtn.disabled = !hasContent;
        });

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Close modal on backdrop click
        const modal = document.getElementById('noteModal');
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async saveQuickNote() {
        const input = document.getElementById('quickNote') as HTMLTextAreaElement;
        const content = input.value.trim();

        if (!content) return;

        await this.addNote(content);
        input.value = '';
        (document.getElementById('saveQuickNote') as HTMLButtonElement).disabled = true;

        // Haptic feedback
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
    }

    async addNote(content: string) {
        const note: Note = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note); // Add to beginning
        await this.saveNotes();
        this.renderNotes();
    }

    async updateNote(id: string, content: string) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) return;

        this.notes[noteIndex].content = content;
        this.notes[noteIndex].updatedAt = new Date().toISOString();
        
        await this.saveNotes();
        this.renderNotes();
    }

    async deleteNote(id: string) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        this.notes = this.notes.filter(note => note.id !== id);
        await this.saveNotes();
        this.renderNotes();

        // Haptic feedback
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        }
    }

    openNoteEditor(noteId?: string) {
        const modal = document.getElementById('noteModal');
        const editor = document.getElementById('noteEditor') as HTMLTextAreaElement;
        const title = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveNote') as HTMLButtonElement;

        this.currentEditingId = noteId || null;

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                editor.value = note.content;
                title!.textContent = 'Edit Note';
            }
        } else {
            editor.value = '';
            title!.textContent = 'New Note';
        }

        saveBtn.disabled = editor.value.trim().length === 0;
        modal?.classList.add('active');
        editor.focus();
    }

    closeModal() {
        const modal = document.getElementById('noteModal');
        modal?.classList.remove('active');
        this.currentEditingId = null;
    }

    async saveNote() {
        const editor = document.getElementById('noteEditor') as HTMLTextAreaElement;
        const content = editor.value.trim();

        if (!content) return;

        if (this.currentEditingId) {
            await this.updateNote(this.currentEditingId, content);
        } else {
            await this.addNote(content);
        }

        this.closeModal();

        // Haptic feedback
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
    }

    private renderNotes() {
        const notesList = document.getElementById('notesList');
        const emptyState = document.getElementById('emptyState');

        if (!notesList || !emptyState) return;

        if (this.notes.length === 0) {
            notesList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        notesList.style.display = 'flex';
        emptyState.style.display = 'none';

        notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" onclick="app.openNoteEditor('${note.id}')">
                <div class="note-preview">${this.escapeHtml(this.truncateText(note.content, 150))}</div>
                <div class="note-meta">
                    <span class="note-date">${this.formatDate(note.createdAt)}</span>
                    <div class="note-actions">
                        <button class="note-action" onclick="event.stopPropagation(); app.openNoteEditor('${note.id}')" title="Edit">✏️</button>
                        <button class="note-action delete" onclick="event.stopPropagation(); app.deleteNote('${note.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    private async loadNotes() {
        try {
            const { value } = await Preferences.get({ key: 'turbo-notes' });
            if (value) {
                this.notes = JSON.parse(value);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.notes = [];
        }
    }

    private async saveNotes() {
        try {
            await Preferences.set({
                key: 'turbo-notes',
                value: JSON.stringify(this.notes)
            });
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for HTML onclick handlers
declare global {
    interface Window {
        app: TurboNotesApp;
        saveQuickNote: () => void;
        openNoteEditor: (id?: string) => void;
        closeModal: () => void;
        saveNote: () => void;
        toggleMenu: () => void;
    }
}

// Initialize the app
const app = new TurboNotesApp();

// Expose functions globally
window.app = app;
window.saveQuickNote = () => app.saveQuickNote();
window.openNoteEditor = (id?: string) => app.openNoteEditor(id);
window.closeModal = () => app.closeModal();
window.saveNote = () => app.saveNote();
window.toggleMenu = () => {
    alert('Menu functionality coming soon!\n\nFeatures:\n- Export notes\n- Settings\n- About');
};

// Handle app lifecycle
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
});

// Handle device ready for Capacitor
document.addEventListener('deviceready', () => {
    console.log('Device ready');
});

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
