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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get model status
  const { data: modelStatus } = useQuery({
    queryKey: ["/api/models/status"],
    refetchInterval: 2000, // Check every 2 seconds
  });

  // Start model mutation
  const startModelMutation = useMutation({
    mutationFn: chatApi.startModel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/status"] });
      toast({
        title: "Model Starting",
        description: `${data.model} is starting up. This may take a few minutes.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Model",
        description: error.message || "An error occurred while starting the model.",
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

  const handleStartModel = () => {
    startModelMutation.mutate(selectedModel);
  };

  const handleStopModel = () => {
    stopModelMutation.mutate();
  };

  const isLoading = startModelMutation.isPending || stopModelMutation.isPending;
  const currentModelInfo = AVAILABLE_MODELS.find(m => m.id === modelStatus?.model);

  return (
    <div className="p-6 border-b border-code-border">
      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <Server className="w-4 h-4" />
        Model Management
      </h3>
      
      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Status:</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              modelStatus?.running ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <Badge variant={modelStatus?.running ? "default" : "secondary"} className="text-xs">
              {modelStatus?.running ? "Running" : "Stopped"}
            </Badge>
          </div>
        </div>

        {/* Currently Running Model */}
        {modelStatus?.running && currentModelInfo && (
          <div className="bg-slate-800 rounded-md p-3">
            <div className="text-xs text-slate-400 mb-1">Currently Running:</div>
            <div className="text-sm text-slate-200 font-medium">{currentModelInfo.name}</div>
            <div className="text-xs text-slate-500">{currentModelInfo.size}</div>
            {modelStatus.pid && (
              <div className="text-xs text-slate-500 mt-1">PID: {modelStatus.pid}</div>
            )}
          </div>
        )}

        {/* Model Selection */}
        {!modelStatus?.running && (
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
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!modelStatus?.running ? (
            <Button
              onClick={handleStartModel}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Model
            </Button>
          ) : (
            <Button
              onClick={handleStopModel}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Stop Model
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-slate-500">
          Models will automatically download on first use. Larger models require more memory and take longer to start.
        </div>
      </div>
    </div>
  );
}