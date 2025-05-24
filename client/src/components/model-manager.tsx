import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2, Server } from "lucide-react";
import { chatApi, type ModelStatus } from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_MODELS = [
  { id: "bigscience/bloom-1b1", name: "BLOOM 1B1", size: "1.1B params" },
  { id: "bigscience/bloom-3b", name: "BLOOM 3B", size: "3B params" },
  { id: "bigscience/bloomz-7b1", name: "BLOOMZ 7B1", size: "7.1B params" },
];

export default function ModelManager() {
  const [selectedModel, setSelectedModel] = useState("bigscience/bloomz-7b1");
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get model status
  const { data: modelStatus } = useQuery({
    queryKey: ["/api/models/status"],
    refetchInterval: 2000, // Check every 2 seconds
  });

  // Get VLLM connection status
  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/chat/status"],
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Generate WSL command for model
  const generateCommandMutation = useMutation({
    mutationFn: chatApi.startModel,
    onSuccess: (data) => {
      setShowInstructions(true);
      toast({
        title: "Command Generated",
        description: `Copy the command below to start ${selectedModel} in WSL`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate command.",
        variant: "destructive",
      });
    },
  });

  // Stop model mutation
  const stopModelMutation = useMutation({
    mutationFn: chatApi.stopModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/status"] });
      toast({
        title: "Model Stopped",
        description: "The model has been successfully stopped.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Stop Model",
        description: error.message || "An error occurred while stopping the model.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCommand = () => {
    generateCommandMutation.mutate(selectedModel);
  };

  const handleStopModel = () => {
    stopModelMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
    });
  };

  const isLoading = generateCommandMutation.isPending || stopModelMutation.isPending;
  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const command = `python3 -m vllm.entrypoints.openai.api_server --model ${selectedModel} --host 0.0.0.0 --port 8000`;

  return (
    <div className="p-6 border-b border-code-border">
      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <Server className="w-4 h-4" />
        Model Management
      </h3>
      
      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">VLLM Status:</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <Badge variant={connectionStatus?.connected ? "default" : "secondary"} className="text-xs">
              {connectionStatus?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">Select Model:</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-slate-200 focus:bg-slate-600">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-slate-400">{model.size}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* WSL Command */}
        <div className="bg-slate-800 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-400">WSL Command for {selectedModelInfo?.name}:</div>
            <Button
              onClick={() => copyToClipboard(command)}
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Copy
            </Button>
          </div>
          <div className="bg-slate-900 rounded p-2 font-mono text-xs text-slate-300 break-all">
            {command}
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus?.connected ? (
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-md p-3">
            <div className="text-xs text-emerald-400 mb-1">✅ Connected to VLLM Server</div>
            <div className="text-xs text-slate-400">Endpoint: localhost:8000</div>
            {connectionStatus?.models && connectionStatus.models.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">
                Running: {connectionStatus.models[0]?.id || 'Unknown'}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-orange-900/20 border border-orange-700 rounded-md p-3">
            <div className="text-xs text-orange-400 mb-1">⚠️ No VLLM Server Detected</div>
            <div className="text-xs text-slate-400">
              Copy the command above and run it in your WSL terminal to start the selected model.
            </div>
          </div>
        )}

        {/* Available Models Info */}
        <div className="bg-slate-800 rounded-md p-3">
          <div className="text-xs text-slate-400 mb-2">Available BLOOM Models:</div>
          <div className="space-y-1">
            {AVAILABLE_MODELS.map((model) => (
              <div key={model.id} className="flex justify-between text-xs">
                <span className="text-slate-300">{model.name}</span>
                <span className="text-slate-500">{model.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Instructions */}
        <div className="text-xs text-slate-500">
          💡 Make sure your VLLM server is accessible on localhost:8000. If running in WSL, 
          the interface should automatically detect it once started.
        </div>
      </div>
    </div>
  );
}