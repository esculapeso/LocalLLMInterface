import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isGenerating: boolean;
}

export default function ChatMessages({ messages, isGenerating }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return "";
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className="max-w-3xl">
            <div className={`flex items-center gap-2 mb-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              {message.role === 'assistant' && (
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-xs text-slate-400">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </span>
              <span className="text-xs text-slate-500">
                {formatTime(message.timestamp)}
              </span>
              {message.role === 'user' && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-md'
                  : 'bg-code-surface border border-code-border text-slate-200 rounded-tl-md'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        </div>
      ))}

      {isGenerating && (
        <div className="flex justify-start">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-slate-400">BLOOMZ-7B1</span>
              <span className="text-xs text-slate-500">typing...</span>
            </div>
            <div className="bg-code-surface border border-code-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
