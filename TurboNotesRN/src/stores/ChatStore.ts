import { makeObservable, observable, action, computed } from 'mobx';
import { Database, Q } from '@nozbe/watermelondb';
import { ChatSessionModel } from '../models/ChatSession';
import { ChatMessageModel } from '../models/ChatMessage';
import { ChatSession, ChatMessage, ChatSettings } from '../services/AIService';
import { v4 as uuidv4 } from 'uuid';

class ChatStore {
  @observable sessions: ChatSession[] = [];
  @observable currentSession: ChatSession | null = null;
  @observable messages: ChatMessage[] = [];
  @observable isLoading = false;
  @observable isGenerating = false;
  @observable streamingMessage = '';

  private database: Database;

  constructor(database: Database) {
    makeObservable(this);
    this.database = database;
  }

  async initialize() {
    await this.loadSessions();
    console.log('💬 ChatStore initialized');
  }

  @computed
  get activeSessions(): ChatSession[] {
    return this.sessions.filter(session => session.isActive);
  }

  @computed
  get recentSessions(): ChatSession[] {
    return this.sessions
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
  }

  @action
  async loadSessions() {
    this.isLoading = true;
    try {
      const sessionsCollection = this.database.get<ChatSessionModel>('chat_sessions');
      const sessionRecords = await sessionsCollection.query().fetch();
      
      this.sessions = sessionRecords.map(record => ({
        id: record.id,
        title: record.title,
        modelId: record.modelId,
        systemPrompt: record.systemPrompt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        isActive: record.isActive,
        messageCount: record.messageCount,
        settings: record.settings
      }));

      console.log(`💬 Loaded ${this.sessions.length} chat sessions`);
    } catch (error) {
      console.error('❌ Failed to load chat sessions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async createSession(
    title: string,
    modelId: string,
    systemPrompt?: string,
    settings?: Partial<ChatSettings>
  ): Promise<ChatSession> {
    try {
      const now = new Date();
      const defaultSettings: ChatSettings = {
        temperature: 0.7,
        maxTokens: 512,
        topP: 0.9,
        stopWords: [],
        stream: true,
        ...settings
      };

      const session: ChatSession = {
        id: uuidv4(),
        title,
        modelId,
        systemPrompt,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        messageCount: 0,
        settings: defaultSettings
      };

      // Save to database
      await this.database.write(async () => {
        const sessionsCollection = this.database.get<ChatSessionModel>('chat_sessions');
        await sessionsCollection.create(record => {
          record.id = session.id;
          record.title = session.title;
          record.modelId = session.modelId;
          record.systemPrompt = session.systemPrompt;
          record.createdAt = session.createdAt;
          record.updatedAt = session.updatedAt;
          record.isActive = session.isActive;
          record.messageCount = session.messageCount;
          record.settings = session.settings;
        });
      });

      this.sessions.unshift(session);
      console.log(`✅ Created chat session: ${session.title}`);
      
      return session;
    } catch (error) {
      console.error('❌ Failed to create chat session:', error);
      throw error;
    }
  }

  @action
  async setCurrentSession(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSession = session;
      await this.loadMessages(sessionId);
    }
  }

  @action
  async loadMessages(sessionId: string) {
    this.isLoading = true;
    try {
      const messagesCollection = this.database.get<ChatMessageModel>('messages');
      const messageRecords = await messagesCollection
        .query(Q.where('session_id', sessionId))
        .fetch();
      
      this.messages = messageRecords.map(record => ({
        id: record.id,
        sessionId: record.sessionId,
        role: record.role,
        content: record.content,
        createdAt: record.createdAt,
        tokens: record.tokens,
        processingTime: record.processingTime
      }));

      console.log(`💬 Loaded ${this.messages.length} messages for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    tokens?: number,
    processingTime?: number
  ): Promise<ChatMessage> {
    try {
      const now = new Date();
      const message: ChatMessage = {
        id: uuidv4(),
        sessionId,
        role,
        content,
        createdAt: now,
        tokens,
        processingTime
      };

      // Save to database
      await this.database.write(async () => {
        const messagesCollection = this.database.get<ChatMessageModel>('messages');
        await messagesCollection.create(record => {
          record.id = message.id;
          record.sessionId = message.sessionId;
          record.role = message.role;
          record.content = message.content;
          record.createdAt = message.createdAt;
          record.tokens = message.tokens;
          record.processingTime = message.processingTime;
        });

        // Update session message count and last updated
        const sessionsCollection = this.database.get<ChatSessionModel>('chat_sessions');
        const sessionRecord = await sessionsCollection.find(sessionId);
        await sessionRecord.update(session => {
          session.messageCount = session.messageCount + 1;
          session.updatedAt = now;
        });
      });

      // Update local state
      this.messages.push(message);
      
      const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        this.sessions[sessionIndex].messageCount++;
        this.sessions[sessionIndex].updatedAt = now;
      }

      return message;
    } catch (error) {
      console.error('❌ Failed to add message:', error);
      throw error;
    }
  }

  @action
  setStreamingMessage(content: string) {
    this.streamingMessage = content;
  }

  @action
  setGenerating(isGenerating: boolean) {
    this.isGenerating = isGenerating;
  }

  @action
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.database.write(async () => {
        // Delete all messages in the session
        const messagesCollection = this.database.get<ChatMessageModel>('messages');
        const messages = await messagesCollection
          .query(Q.where('session_id', sessionId))
          .fetch();
        
        await Promise.all(messages.map(message => message.destroyPermanently()));

        // Delete the session
        const sessionsCollection = this.database.get<ChatSessionModel>('chat_sessions');
        const sessionRecord = await sessionsCollection.find(sessionId);
        await sessionRecord.destroyPermanently();
      });

      // Update local state
      this.sessions = this.sessions.filter(s => s.id !== sessionId);
      
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
        this.messages = [];
      }

      console.log(`🗑️ Deleted chat session: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to delete chat session:', error);
      throw error;
    }
  }

  @action
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      await this.database.write(async () => {
        const sessionsCollection = this.database.get<ChatSessionModel>('chat_sessions');
        const sessionRecord = await sessionsCollection.find(sessionId);
        await sessionRecord.update(session => {
          session.title = title;
          session.updatedAt = new Date();
        });
      });

      const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        this.sessions[sessionIndex].title = title;
        this.sessions[sessionIndex].updatedAt = new Date();
      }

      if (this.currentSession?.id === sessionId) {
        this.currentSession.title = title;
      }

      console.log(`✅ Updated session title: ${title}`);
    } catch (error) {
      console.error('❌ Failed to update session title:', error);
      throw error;
    }
  }

  // Export chat session as markdown
  async exportSession(sessionId: string): Promise<string> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    const messages = this.messages.filter(m => m.sessionId === sessionId);
    
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Model:** ${session.modelId}\n`;
    markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
    if (session.systemPrompt) {
      markdown += `**System Prompt:** ${session.systemPrompt}\n`;
    }
    markdown += `\n---\n\n`;

    for (const message of messages) {
      const roleEmoji = message.role === 'user' ? '👤' : '🤖';
      markdown += `## ${roleEmoji} ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (message.tokens || message.processingTime) {
        markdown += `*`;
        if (message.tokens) markdown += `Tokens: ${message.tokens}`;
        if (message.tokens && message.processingTime) markdown += ` | `;
        if (message.processingTime) markdown += `Time: ${message.processingTime}ms`;
        markdown += `*\n\n`;
      }
      
      markdown += `---\n\n`;
    }

    return markdown;
  }
}

export default ChatStore;
