import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Relation } from '@nozbe/watermelondb';
import { ChatSessionModel } from './ChatSession';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  tokens?: number;
  processingTime?: number;
}

export class ChatMessageModel extends Model {
  static table = 'messages';
  static associations = {
    session: { type: 'belongs_to' as const, key: 'session_id' },
  };

  @field('session_id') sessionId!: string;
  @field('role') role!: 'user' | 'assistant' | 'system';
  @field('content') content!: string;
  @date('created_at') createdAt!: Date;
  @field('tokens') tokens?: number;
  @field('processing_time') processingTime?: number;

  @relation('chat_sessions', 'session_id') session!: Relation<ChatSessionModel>;
}
