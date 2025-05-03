import React, { useState, useEffect } from 'react';
import { toast } from '../../hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './empty-state';

export interface ErrorData {
  error: string;
  details?: string;
  errorTime: string;
  errorLocation: string;
  moduleName?: string;
}

// For development errors and backend issues - keep these as toast notifications
export function createErrorToast(errorData: ErrorData) {
  // Only show toast notifications for system errors, not for "no data" situations
  if (errorData.error.includes('Failed to fetch') || 
      errorData.error.includes('Network Error') ||
      errorData.error.toLowerCase().includes('internal server error')) {
    
    toast({
      variant: "destructive",
      title: errorData.error,
      description: errorData.details || `Error occurred at ${errorData.errorTime} on ${errorData.errorLocation}`,
    });
  }
}

// For UI-related "no data" scenarios, use this component instead of error toasts
export function DataErrorFallback({ moduleName }: { moduleName: string }) {
  return (
    <EmptyState
      title={`No ${moduleName} data available`}
      description={`The ${moduleName} data is not available at the moment. This section is being set up.`}
      icon="database"
      iconColor="#025E73"
    />
  );
}

export class ErrorHandler {
  static handleError(error: any, location: string = "unknown", moduleName?: string) {
    const errorTime = new Date().toLocaleString();
    
    // Create an error object to be displayed
    const errorMessage = error?.message || 'An unknown error occurred';
    const errorDetails = error?.stack ? error.stack.split('\n')[0] : '';
    
    const errorData: ErrorData = {
      error: errorMessage,
      details: errorDetails,
      errorTime,
      errorLocation: location,
      moduleName
    };
    
    // Log to console for debugging only (don't display to users)
    console.error(`%c[${errorTime}] Error on ${location}`, 'color: #FF5252; font-weight: bold;', error);
    
    // Only display toast for system errors, not for "no data" situations
    if (!isDataNotFoundError(errorMessage)) {
      createErrorToast(errorData);
    }
    
    // You can also send the error to a logging service here
    // sendToLoggingService(errorData);
  }
}

// Helper function to identify "no data" errors vs system errors
function isDataNotFoundError(errorMessage: string): boolean {
  const dataNotFoundPatterns = [
    'no data',
    'not found',
    'empty',
    'no results',
    'no records',
    'no items',
    'failed to load'
  ];
  
  return dataNotFoundPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  );
}