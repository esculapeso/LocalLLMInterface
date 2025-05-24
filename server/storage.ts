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
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(conversations.createdAt);
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(insertConversation).returning();
    return result[0];
  }

  async deleteConversation(id: number): Promise<void> {
    // Delete messages first (foreign key constraint)
    await db.delete(messages).where(eq(messages.conversationId, id));
    // Then delete conversation
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async clearMessages(conversationId: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
  }

  async getChatSettings(): Promise<ChatSettings | undefined> {
    const result = await db.select().from(chatSettings).limit(1);
    if (result.length === 0) {
      // Create default settings if none exist
      const defaultSettings = { temperature: "0.7", maxTokens: 512 };
      const created = await db.insert(chatSettings).values(defaultSettings).returning();
      return created[0];
    }
    return result[0];
  }

  async updateChatSettings(settings: InsertChatSettings): Promise<ChatSettings> {
    // Get existing settings or create if none exist
    const existing = await this.getChatSettings();
    if (existing) {
      const result = await db.update(chatSettings)
        .set(settings)
        .where(eq(chatSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(chatSettings).values(settings).returning();
      return result[0];
    }
  }
}

export const storage = new DatabaseStorage();
