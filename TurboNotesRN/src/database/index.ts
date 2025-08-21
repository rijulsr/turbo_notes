import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import { NoteModel } from '../models/Note';
import { ChatSessionModel } from '../models/ChatSession';
import { ChatMessageModel } from '../models/ChatMessage';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema,
  // Optional database name (defaults to 'watermelondb')
  dbName: 'turbo_notes',
  // Enable migrations for schema updates
  migrations: [],
  // SQLite-specific options
  jsi: true, // Use JSI for better performance
  // Enable WAL mode for better concurrent access
  experimentalUseJSI: true,
});

// Database instance
export const database = new Database({
  adapter,
  modelClasses: [
    NoteModel,
    ChatSessionModel,
    ChatMessageModel,
  ],
});

// Export for use in stores and components
export default database;

