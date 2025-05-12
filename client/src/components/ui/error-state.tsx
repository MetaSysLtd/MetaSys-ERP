import { Button } from "./button";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  error?: any;
}

export function ErrorState({ title, message, onRetry, error }: ErrorStateProps) {
  return (
    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-4 bg-[#025E73] hover:bg-[#025E73]/90 text-white rounded-md px-4 py-2 transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Try Again
        </button>
      )}
      {error && process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 text-xs text-left text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
          {error.message}
        </pre>
      )}
    </div>
  );
}