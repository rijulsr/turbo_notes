import { Model } from '@nozbe/watermelondb';
import { field, date, json } from '@nozbe/watermelondb/decorators';

export interface Note {
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
  attachments: string[];
}

export class NoteModel extends Model {
  static table = 'notes';

  @field('title') title!: string;
  @field('content') content!: string;
  @field('category') category!: string;
  @json('tags', (tags: string[]) => tags) tags!: string[];
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_pinned') isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @field('ai_generated') aiGenerated!: boolean;
  @field('image_url') imageUrl?: string;
  @json('attachments', (attachments: string[]) => attachments) attachments!: string[];
}
