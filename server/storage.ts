import { 
  users, 
  conversations, 
  messages, 
  chatSettings,
  type User, 
  type InsertUser, 
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ChatSettings,
  type InsertChatSettings
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  
  getMessages(conversationId: number): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  clearMessages(conversationId: number): Promise<void>;
  
  getChatSettings(): Promise<ChatSettings | undefined>;
  updateChatSettings(settings: InsertChatSettings): Promise<ChatSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private chatSettings: ChatSettings | undefined;
  private userIdCounter: number;
  private conversationIdCounter: number;
  private messageIdCounter: number;
  private settingsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;
    this.settingsIdCounter = 1;
    
    // Initialize default settings
    this.chatSettings = {
      id: this.settingsIdCounter++,
      temperature: "0.7",
      maxTokens: 512,
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    // Also delete all messages for this conversation
    for (const [messageId, message] of this.messages.entries()) {
      if (message.conversationId === id) {
        this.messages.delete(messageId);
      }
    }
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(conversationId: number): Promise<void> {
    for (const [messageId, message] of this.messages.entries()) {
      if (message.conversationId === conversationId) {
        this.messages.delete(messageId);
      }
    }
  }

  async getChatSettings(): Promise<ChatSettings | undefined> {
    return this.chatSettings;
  }

  async updateChatSettings(settings: InsertChatSettings): Promise<ChatSettings> {
    this.chatSettings = {
      id: this.chatSettings?.id || 1,
      ...settings,
    };
    return this.chatSettings;
  }
}

export const storage = new MemStorage();
