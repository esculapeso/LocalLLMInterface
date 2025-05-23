import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "@/lib/chat-api";
import ChatSidebar from "@/components/chat-sidebar";
import ChatMessages from "@/components/chat-messages";
import ChatInput from "@/components/chat-input";
import ConnectionModal from "@/components/connection-modal";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState<(ChatMessage & { id?: string; timestamp?: Date })[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId] = useState(1); // For now, use a single conversation
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check connection status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/chat/status"],
    refetchInterval: 10000, // Check every 10 seconds
    retry: false,
  });

  // Get chat settings
  const { data: settings } = useQuery({
    queryKey: ["/api/chat/settings"],
  });

  // Get model status
  const { data: modelStatus } = useQuery({
    queryKey: ["/api/models/status"],
    refetchInterval: 5000,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: chatApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/settings"] });
      toast({
        title: "Settings updated",
        description: "Your chat settings have been saved.",
      });
    },
  });

  // Clear conversation mutation
  const clearConversationMutation = useMutation({
    mutationFn: () => chatApi.clearConversation(conversationId),
    onSuccess: () => {
      setMessages([]);
      toast({
        title: "Conversation cleared",
        description: "All messages have been removed.",
      });
    },
  });

  // Send message and get completion
  const sendMessage = async (content: string) => {
    if (isGenerating || !content.trim()) return;

    const userMessage: ChatMessage & { id: string; timestamp: Date } = {
      role: "user",
      content: content.trim(),
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const messagesForAPI = [...messages, userMessage].map(({ id, timestamp, ...msg }) => msg);
      
      const response = await chatApi.getChatCompletion(
        messagesForAPI,
        parseFloat(settings?.temperature || "0.7"),
        settings?.maxTokens || 512
      );

      const assistantMessage: ChatMessage & { id: string; timestamp: Date } = {
        role: "assistant",
        content: response.choices[0].message.content,
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle connection errors
  useEffect(() => {
    if (status && !status.connected) {
      setShowConnectionModal(true);
    } else {
      setShowConnectionModal(false);
    }
  }, [status]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        clearConversationMutation.mutate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearConversationMutation]);

  return (
    <div className="flex h-screen bg-code-bg text-slate-100">
      <ChatSidebar
        status={status}
        settings={settings}
        onUpdateSettings={(newSettings) => updateSettingsMutation.mutate(newSettings)}
        onClearConversation={() => clearConversationMutation.mutate()}
        messageCount={messages.length}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-code-surface border-b border-code-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Chat Session</h2>
              <p className="text-sm text-slate-400">Interact with your local LLM model</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <i className="fas fa-comment text-xs"></i>
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
        </div>

        <ChatMessages 
          messages={messages} 
          isGenerating={isGenerating} 
        />
        
        <ChatInput 
          onSendMessage={sendMessage}
          disabled={isGenerating || !status?.connected}
        />
      </div>

      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onRetry={() => refetchStatus()}
        status={status}
      />
    </div>
  );
}
