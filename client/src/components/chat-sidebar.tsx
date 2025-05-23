import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import ModelManager from "./model-manager";

interface ChatSidebarProps {
  status?: {
    connected: boolean;
    server?: string;
    endpoint?: string;
  };
  settings?: {
    temperature: string;
    maxTokens: number;
  };
  onUpdateSettings: (settings: { temperature?: string; maxTokens?: number }) => void;
  onClearConversation: () => void;
  messageCount: number;
}

export default function ChatSidebar({
  status,
  settings,
  onUpdateSettings,
  onClearConversation,
  messageCount,
}: ChatSidebarProps) {
  const temperature = parseFloat(settings?.temperature || "0.7");
  const maxTokens = settings?.maxTokens || 512;

  return (
    <div className="w-80 bg-code-surface border-r border-code-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-code-border">
        <h1 className="text-xl font-semibold text-slate-100 mb-2">Local LLM Chat</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm text-slate-400">
              {status?.connected ? 'Connected to localhost:8000' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Model Management */}
      <ModelManager />

      {/* Chat Settings */}
      <div className="p-6 border-b border-code-border">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Settings</h3>
        <div className="space-y-4">
          <div>
            <Label className="block text-xs text-slate-400 mb-2">Temperature</Label>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => 
                onUpdateSettings({ temperature: value.toString() })
              }
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0</span>
              <span>{temperature}</span>
              <span>2</span>
            </div>
          </div>
          <div>
            <Label className="block text-xs text-slate-400 mb-2">Max Tokens</Label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
              min={1}
              max={2048}
              className="w-full bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 mt-auto">
        <Button
          onClick={onClearConversation}
          variant="outline"
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Conversation
        </Button>
      </div>
    </div>
  );
}
