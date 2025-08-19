import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Notes table
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'ai_generated', type: 'boolean' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'attachments', type: 'string' }, // JSON array
      ],
    }),

    // Chat sessions table
    tableSchema({
      name: 'chat_sessions',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'model_id', type: 'string' },
        { name: 'system_prompt', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'message_count', type: 'number' },
        { name: 'settings', type: 'string' }, // JSON object
      ],
    }),

    // Chat messages table
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'tokens', type: 'number', isOptional: true },
        { name: 'processing_time', type: 'number', isOptional: true },
      ],
    }),

    // AI model settings table
    tableSchema({
      name: 'model_settings',
      columns: [
        { name: 'model_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'path', type: 'string' },
        { name: 'size', type: 'number' },
        { name: 'is_downloaded', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
        { name: 'download_progress', type: 'number' },
        { name: 'last_used', type: 'number', isOptional: true },
        { name: 'settings', type: 'string' }, // JSON object
      ],
    }),

    // Global app settings table
    tableSchema({
      name: 'app_settings',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'type', type: 'string' }, // 'string', 'number', 'boolean', 'json'
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;
