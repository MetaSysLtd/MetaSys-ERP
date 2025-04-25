import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Allowed file types
export type FileType = 'image' | 'document' | 'pdf' | 'csv' | 'all';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<string | void>;
  fileType?: FileType;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  accept?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export function FileUpload({
  onFileUpload,
  fileType = 'all',
  maxSizeMB = 10,
  label,
  description,
  accept,
  className,
  value,
  onChange,
  error
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Accept attribute based on file type
  const getAcceptAttribute = (): string => {
    const typeMap: Record<FileType, string> = {
      image: 'image/jpeg,image/png,image/gif,image/webp',
      document: '.doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt',
      pdf: 'application/pdf',
      csv: 'text/csv',
      all: '*/*'
    };
    return accept || typeMap[fileType];
  };

  // File size validation
  const validateFileSize = (file: File): boolean => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setUploadError(`File size exceeds ${maxSizeMB}MB limit`);
      toast({
        title: 'File too large',
        description: `Maximum allowed size is ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  // File type validation
  const validateFileType = (file: File): boolean => {
    if (fileType === 'all') return true;
    
    const acceptedTypes = getAcceptAttribute().split(',');
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;
    
    const isValid = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExt === type.substring(1);
      } else {
        return mimeType.match(type.replace('*', '.*'));
      }
    });
    
    if (!isValid) {
      const typeDesc = fileType === 'image' ? 'images (JPG, PNG, GIF)' : 
                       fileType === 'document' ? 'documents (DOC, PDF, XLS)' :
                       fileType === 'pdf' ? 'PDF files' :
                       fileType === 'csv' ? 'CSV files' : 'valid files';
      
      setUploadError(`Invalid file type. Please upload ${typeDesc}`);
      toast({
        title: 'Invalid file type',
        description: `Please upload ${typeDesc}`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  // Handle file change event
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setUploadError('');
    setUploadSuccess(false);
    
    if (!validateFileSize(selectedFile) || !validateFileType(selectedFile)) {
      e.target.value = '';
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 95);
        });
      }, 300);
      
      // Upload file
      const result = await onFileUpload(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploadSuccess(true);
      
      if (result && onChange) {
        onChange(result);
      }
      
      toast({
        title: 'Upload successful',
        description: `${fileName} has been uploaded`,
        variant: 'success'
      });
      
      // Reset progress after a delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 2000);
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset the upload
  const handleReset = () => {
    setFile(null);
    setFileName('');
    setUploadError('');
    setUploadSuccess(false);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div className={cn(
        "border-2 border-dashed rounded-lg p-4 transition-colors",
        uploadError ? "border-destructive/50 bg-destructive/5" : 
        uploadSuccess ? "border-green-500/50 bg-green-500/5" : 
        "border-muted-foreground/25 hover:border-muted-foreground/50",
        "focus-within:border-primary"
      )}>
        <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
          {!file ? (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drag & drop or click to upload
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSizeMB}MB • {getAcceptAttribute().replace(/\*\//g, '').replace(/,/g, ', ')}
                </p>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="mt-2"
              >
                Select File
              </Button>
            </>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {fileName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploading ? (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  {uploadSuccess ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                      onClick={handleReset}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Upload Complete
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-brandPrimary hover:bg-brandPrimary/90 text-white"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload File'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {uploadError && (
        <div className="flex items-center text-destructive text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{uploadError}</span>
        </div>
      )}
      
      {error && !uploadError && (
        <div className="flex items-center text-destructive text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={getAcceptAttribute()}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}