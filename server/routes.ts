import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn, ChildProcess } from "child_process";
import { storage } from "./storage";
import { 
  chatCompletionRequestSchema,
  insertMessageSchema,
  insertChatSettingsSchema 
} from "@shared/schema";
import { z } from "zod";

// Global process management
let vllmProcess: ChildProcess | null = null;
let currentModel: string | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Start VLLM model (generates WSL command for user)
  app.post("/api/models/start", async (req, res) => {
    try {
      const { model } = req.body;
      
      if (!model || !["bigscience/bloom-1b1", "bigscience/bloom-3b", "bigscience/bloomz-7b1"].includes(model)) {
        return res.status(400).json({ error: "Invalid model specified" });
      }

      // Generate the command for the user to run in WSL
      const command = `python3 -m vllm.entrypoints.openai.api_server --model ${model} --host 0.0.0.0 --port 8000`;
      
      res.json({ 
        message: `To start ${model}, run this command in your WSL terminal:`,
        command,
        model,
        instructions: [
          "1. Open your WSL terminal",
          "2. Copy and run the command above",
          "3. Wait for the model to load",
          "4. The interface will automatically detect when it's ready"
        ]
      });
    } catch (error) {
      console.error("Start model error:", error);
      res.status(500).json({ 
        error: "Failed to generate start command",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Stop VLLM model
  app.post("/api/models/stop", async (req, res) => {
    try {
      if (!vllmProcess) {
        return res.status(400).json({ error: "No model is currently running" });
      }

      vllmProcess.kill('SIGTERM');
      
      // Give it a moment to shut down gracefully
      setTimeout(() => {
        if (vllmProcess && !vllmProcess.killed) {
          vllmProcess.kill('SIGKILL');
        }
      }, 5000);

      res.json({ message: "Model stopped" });
    } catch (error) {
      console.error("Stop model error:", error);
      res.status(500).json({ 
        error: "Failed to stop model",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get model status
  app.get("/api/models/status", async (req, res) => {
    res.json({
      running: vllmProcess !== null,
      model: currentModel,
      pid: vllmProcess?.pid || null
    });
  });

  // Chat completion endpoint - proxies to local VLLM server
  app.post("/api/chat/completions", async (req, res) => {
    try {
      const validatedRequest = chatCompletionRequestSchema.parse(req.body);
      
      // Get current settings
      const settings = await storage.getChatSettings();
      const temperature = validatedRequest.temperature || parseFloat(settings?.temperature || "0.7");
      const maxTokens = validatedRequest.maxTokens || settings?.maxTokens || 512;

      // Make request to local VLLM server
      const vllmHost = process.env.VLLM_HOST || "localhost";
      const vllmResponse = await fetch(`http://${vllmHost}:8000/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel || "bigscience/bloomz-7b1",
          messages: validatedRequest.messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!vllmResponse.ok) {
        throw new Error(`VLLM server error: ${vllmResponse.status} ${vllmResponse.statusText}`);
      }

      const completion = await vllmResponse.json();
      res.json(completion);
    } catch (error) {
      console.error("Chat completion error:", error);
      res.status(500).json({ 
        error: "Failed to get chat completion",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Check VLLM server connection
  app.get("/api/chat/status", async (req, res) => {
    try {
      const vllmHost = process.env.VLLM_HOST || "localhost";
      const response = await fetch(`http://${vllmHost}:8000/v1/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const models = await response.json();
        res.json({ 
          connected: true, 
          models: models.data || [],
          server: "VLLM",
          endpoint: "http://localhost:8000"
        });
      } else {
        res.status(503).json({ 
          connected: false, 
          error: "VLLM server not responding" 
        });
      }
    } catch (error) {
      res.status(503).json({ 
        connected: false, 
        error: "Cannot connect to VLLM server",
        details: error instanceof Error ? error.message : "Connection failed"
      });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Add message to conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const messageData = {
        ...req.body,
        conversationId,
      };

      const validatedMessage = insertMessageSchema.parse(messageData);
      const message = await storage.addMessage(validatedMessage);
      res.json(message);
    } catch (error) {
      console.error("Add message error:", error);
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  // Clear conversation messages
  app.delete("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      await storage.clearMessages(conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Clear messages error:", error);
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // Get chat settings
  app.get("/api/chat/settings", async (req, res) => {
    try {
      const settings = await storage.getChatSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Update chat settings
  app.put("/api/chat/settings", async (req, res) => {
    try {
      const validatedSettings = insertChatSettingsSchema.parse(req.body);
      const settings = await storage.updateChatSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation({ title: "New Chat" });
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
