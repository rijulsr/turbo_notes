import { Model } from '@nozbe/watermelondb';
import { field, date, json, children } from '@nozbe/watermelondb/decorators';
import type { Query } from '@nozbe/watermelondb';
import { ChatMessageModel } from './ChatMessage';

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  messageCount: number;
  settings: ChatSettings;
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  stopWords: string[];
  stream: boolean;
}

export class ChatSessionModel extends Model {
  static table = 'chat_sessions';
  static associations = {
    messages: { type: 'has_many' as const, foreignKey: 'session_id' },
  };

  @field('title') title!: string;
  @field('model_id') modelId!: string;
  @field('system_prompt') systemPrompt?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_active') isActive!: boolean;
  @field('message_count') messageCount!: number;
  @json('settings', (settings: ChatSettings) => settings) settings!: ChatSettings;

  @children('messages') messages!: Query<ChatMessageModel>;
}

