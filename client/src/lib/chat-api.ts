import { apiRequest } from "./queryClient";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

export interface ChatStatus {
  connected: boolean;
  models?: any[];
  server?: string;
  endpoint?: string;
  error?: string;
  details?: string;
}

export interface ChatSettings {
  id: number;
  temperature: string;
  maxTokens: number;
}

export interface ModelStatus {
  running: boolean;
  model: string | null;
  pid: number | null;
}

export const chatApi = {
  async getChatCompletion(messages: ChatMessage[], temperature?: number, maxTokens?: number): Promise<ChatCompletionResponse> {
    const response = await apiRequest("POST", "/api/chat/completions", {
      messages,
      temperature,
      maxTokens,
    });
    return response.json();
  },

  async getStatus(): Promise<ChatStatus> {
    const response = await apiRequest("GET", "/api/chat/status");
    return response.json();
  },

  async getSettings(): Promise<ChatSettings> {
    const response = await apiRequest("GET", "/api/chat/settings");
    return response.json();
  },

  async updateSettings(settings: Partial<Pick<ChatSettings, 'temperature' | 'maxTokens'>>): Promise<ChatSettings> {
    const response = await apiRequest("PUT", "/api/chat/settings", settings);
    return response.json();
  },

  async clearConversation(conversationId: number): Promise<void> {
    await apiRequest("DELETE", `/api/conversations/${conversationId}/messages`);
  },

  async createConversation(): Promise<{ id: number; title: string; createdAt: string }> {
    const response = await apiRequest("POST", "/api/conversations");
    return response.json();
  },

  async getModelStatus(): Promise<ModelStatus> {
    const response = await apiRequest("GET", "/api/models/status");
    return response.json();
  },

  async startModel(model: string): Promise<{ message: string; model: string; pid: number }> {
    const response = await apiRequest("POST", "/api/models/start", { model });
    return response.json();
  },

  async stopModel(): Promise<{ message: string }> {
    const response = await apiRequest("POST", "/api/models/stop");
    return response.json();
  },
};
