import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  const characterCount = message.length;
  const maxLength = 2000;

  return (
    <div className="border-t border-code-border bg-code-surface p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
              disabled={disabled}
              maxLength={maxLength}
              className="w-full bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 resize-none focus:ring-blue-500 focus:border-blue-500"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center gap-1">
              <span>Ctrl+K to clear</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={characterCount > maxLength * 0.9 ? "text-orange-400" : ""}>
              {characterCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
