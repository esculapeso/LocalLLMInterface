import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  status?: {
    connected: boolean;
    error?: string;
    details?: string;
  };
}

export default function ConnectionModal({
  isOpen,
  onClose,
  onRetry,
  status,
}: ConnectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-code-surface border border-code-border text-slate-100 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-100">
              Connection Error
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 mb-4">
            Unable to connect to the local VLLM server. Please ensure the server is running on localhost:8000.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-800 rounded-md p-3 mb-4">
          <code className="text-sm font-mono text-slate-300">
            python3 -m vllm.entrypoints.openai.api_server --model bigscience/bloomz-7b1
          </code>
        </div>

        {status?.error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
            <p className="text-sm text-red-300">
              <strong>Error:</strong> {status.error}
            </p>
            {status.details && (
              <p className="text-xs text-red-400 mt-1">
                {status.details}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
