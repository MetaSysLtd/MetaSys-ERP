
import { Button } from "./button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  error?: any;
}

export function ErrorState({ title, message, onRetry, error }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[200px] text-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
        {title}
      </h3>
      <p className="text-red-600 dark:text-red-400 mb-4 max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="bg-white dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
      {error?.status === 401 && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-4">
          Your session may have expired. Please try refreshing the page.
        </p>
      )}
    </div>
  );
}
