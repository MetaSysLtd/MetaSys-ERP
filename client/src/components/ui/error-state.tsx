import { Button } from "./button";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  error?: any;
}

export function ErrorState({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-destructive/10 bg-destructive/5">
      <ExclamationTriangleIcon className="h-12 w-12 text-destructive" />
      <h3 className="mt-4 text-lg font-semibold text-destructive">Error loading data</h3>
      <p className="text-muted-foreground text-center mt-2">{error?.message || 'Failed to load data. Please try again.'}</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          className="mt-6 bg-[#025E73] hover:bg-[#011F26] text-white rounded-md transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}