import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Upload, Trash2, Copy, RefreshCw, FolderPlus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";

// Media file type
interface MediaFile {
  id: string;
  filename: string;
  path: string;
  type: string;
  size: number;
  uploaded: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Folder type
interface Folder {
  id: string;
  name: string;
  path: string;
  created: string;
}

export default function MediaManager() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("/");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Demo media files and folders
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([
    {
      id: "1",
      filename: "metio-logo.svg",
      path: "/src/assets/metio-logo.svg",
      type: "image/svg+xml",
      size: 2458,
      uploaded: new Date().toISOString(),
      dimensions: {
        width: 120,
        height: 40
      }
    },
    {
      id: "2",
      filename: "auth-bg.jpg",
      path: "/src/assets/auth-bg.jpg",
      type: "image/jpeg",
      size: 245800,
      uploaded: new Date().toISOString(),
      dimensions: {
        width: 1920,
        height: 1080
      }
    },
    {
      id: "3",
      filename: "dashboard-placeholder.png",
      path: "/images/dashboard-placeholder.png",
      type: "image/png",
      size: 145222,
      uploaded: new Date().toISOString(),
      dimensions: {
        width: 800,
        height: 600
      }
    },
    {
      id: "4",
      filename: "user-guide.pdf",
      path: "/docs/user-guide.pdf",
      type: "application/pdf",
      size: 1045000,
      uploaded: new Date().toISOString()
    }
  ]);
  
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "folder-1",
      name: "images",
      path: "/images",
      created: new Date().toISOString()
    },
    {
      id: "folder-2",
      name: "docs",
      path: "/docs",
      created: new Date().toISOString()
    },
    {
      id: "folder-3",
      name: "src",
      path: "/src",
      created: new Date().toISOString()
    }
  ]);

  // Filter files and folders by search query and current folder
  const filteredMedia = mediaFiles.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (currentFolder === "/" ? true : file.path.startsWith(currentFolder + "/"))
  );
  
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (currentFolder === "/" ? 
      !folder.path.substring(1).includes("/") : // Only show top-level folders in root
      folder.path.startsWith(currentFolder + "/") && folder.path.substring(currentFolder.length + 1).split("/").length === 1) // Only show direct children
  );

  // In a real application, this would fetch from your API
  useEffect(() => {
    const fetchMediaData = async () => {
      setIsLoading(true);
      try {
        // Mock API call - in a real app this would be:
        // const response = await apiRequest("GET", "/api/admin/media?folder=" + currentFolder);
        // setMediaFiles(response.files);
        // setFolders(response.folders);
        
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Using initial state instead of API for demo
      } catch (error) {
        toast({
          title: "Error fetching media",
          description: "There was a problem loading your media files.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaData();
  }, [currentFolder]);

  // File upload handler
  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real application, this would be an API call with FormData:
      // const formData = new FormData();
      // formData.append('file', files[0]);
      // formData.append('folder', currentFolder);
      // const response = await fetch('/api/admin/media/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simulate a successful upload by adding to the list
      const file = files[0];
      const newFile: MediaFile = {
        id: `new-${Date.now()}`,
        filename: file.name,
        path: `${currentFolder === '/' ? '' : currentFolder}/${file.name}`,
        type: file.type,
        size: file.size,
        uploaded: new Date().toISOString(),
        dimensions: file.type.startsWith('image/') ? { width: 800, height: 600 } : undefined
      };
      
      setMediaFiles(prev => [...prev, newFile]);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      setUploadFormVisible(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Create folder handler
  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      toast({
        title: "Folder name required",
        description: "Please enter a name for the new folder.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // In a real application, this would be an API call:
      // await apiRequest("POST", "/api/admin/media/folders", {
      //   name: newFolderName,
      //   parent: currentFolder
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate a successful folder creation
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        path: `${currentFolder === '/' ? '' : currentFolder}/${newFolderName}`,
        created: new Date().toISOString()
      };
      
      setFolders(prev => [...prev, newFolder]);
      
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" has been created.`,
      });
      
      setNewFolderName("");
      setCreateFolderVisible(false);
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: "There was a problem creating the folder.",
        variant: "destructive"
      });
    }
  };

  // Delete file handler
  const handleDeleteFile = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.filename}? This cannot be undone.`)) {
      return;
    }
    
    try {
      // In a real application, this would be an API call:
      // await apiRequest("DELETE", `/api/admin/media/files/${file.id}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from the list
      setMediaFiles(prev => prev.filter(f => f.id !== file.id));
      
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
      
      toast({
        title: "File deleted",
        description: `${file.filename} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: "There was a problem deleting the file.",
        variant: "destructive"
      });
    }
  };

  // Copy file path to clipboard
  const copyPathToClipboard = (path: string) => {
    navigator.clipboard.writeText(path).then(
      () => {
        toast({
          title: "Path copied",
          description: "File path copied to clipboard.",
        });
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy path to clipboard.",
          variant: "destructive"
        });
      }
    );
  };

  // Navigate to folder
  const navigateToFolder = (folderPath: string) => {
    setCurrentFolder(folderPath);
    setSelectedFile(null);
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // File icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📑';
    return '📁';
  };

  // Breadcrumb navigation
  const renderBreadcrumbs = () => {
    if (currentFolder === '/') {
      return (
        <div className="flex items-center text-sm mb-4">
          <span className="font-medium">Home</span>
        </div>
      );
    }
    
    const parts = currentFolder.split('/').filter(Boolean);
    let path = '';
    
    return (
      <div className="flex items-center text-sm mb-4">
        <span 
          className="cursor-pointer hover:underline"
          onClick={() => navigateToFolder('/')}
        >
          Home
        </span>
        
        {parts.map((part, i) => {
          path += `/${part}`;
          
          return (
            <div key={i} className="flex items-center">
              <span className="mx-1">/</span>
              <span 
                className="cursor-pointer hover:underline"
                onClick={() => navigateToFolder(path)}
              >
                {part}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Check if user is admin
  useEffect(() => {
    if (user && user.roleId !== 1) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the media manager.",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Manager</h1>
            <p className="text-muted-foreground">
              Upload and manage media files for your application
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCreateFolderVisible(!createFolderVisible)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button 
              onClick={() => setUploadFormVisible(!uploadFormVisible)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Create Folder Form */}
        {createFolderVisible && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Folder</CardTitle>
              <CardDescription>
                Create a new folder in the current directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input 
                    id="folder-name" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCreateFolderVisible(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Folder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* File Upload Form */}
        {uploadFormVisible && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload a new file to the current directory: {currentFolder}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input 
                    id="file-upload" 
                    type="file"
                    className="p-2"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setUploadFormVisible(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files & Folders</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search files..."
                        className="pl-8 w-[200px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        // In a real app, you'd also refresh the file list from the server
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {renderBreadcrumbs()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFolders.length === 0 && filteredMedia.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No files or folders</h3>
                    <p className="text-muted-foreground mt-2">
                      {searchQuery 
                        ? `No results found for "${searchQuery}". Try a different search term.` 
                        : "This folder is empty. Upload files or create folders to get started."}
                    </p>
                    {!searchQuery && (
                      <div className="flex justify-center mt-4 space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => setCreateFolderVisible(true)}
                        >
                          <FolderPlus className="mr-2 h-4 w-4" />
                          New Folder
                        </Button>
                        <Button 
                          onClick={() => setUploadFormVisible(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload File
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Display folders */}
                    {filteredFolders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Folders</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {filteredFolders.map(folder => (
                            <div 
                              key={folder.id}
                              className="p-3 border rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              onClick={() => navigateToFolder(folder.path)}
                            >
                              <div className="flex items-center">
                                <span className="text-2xl mr-2">📁</span>
                                <span className="truncate font-medium text-sm">{folder.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display files */}
                    {filteredMedia.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Files</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {filteredMedia.map(file => (
                            <div 
                              key={file.id}
                              className={`p-3 border rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedFile?.id === file.id ? 'bg-slate-100 dark:bg-slate-800 border-primary' : ''}`}
                              onClick={() => setSelectedFile(file)}
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="h-12 flex items-center justify-center mb-2">
                                  {file.type.startsWith('image/') ? (
                                    <img 
                                      src={file.path} 
                                      alt={file.filename}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-3xl">{getFileIcon(file.type)}</span>
                                  )}
                                </div>
                                <span className="truncate text-sm font-medium w-full">{file.filename}</span>
                                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>File Details</CardTitle>
                <CardDescription>
                  {selectedFile ? "View and manage file details" : "Select a file to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-4">
                    {selectedFile.type.startsWith('image/') && (
                      <div className="border rounded p-2 mb-4">
                        <img 
                          src={selectedFile.path} 
                          alt={selectedFile.filename}
                          className="max-w-full h-auto object-contain mx-auto"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Filename:</span>
                        <span className="text-sm">{selectedFile.filename}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Type:</span>
                        <span className="text-sm">{selectedFile.type}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Size:</span>
                        <span className="text-sm">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      
                      {selectedFile.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Dimensions:</span>
                          <span className="text-sm">{selectedFile.dimensions.width} × {selectedFile.dimensions.height}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Uploaded:</span>
                        <span className="text-sm">{new Date(selectedFile.uploaded).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Path:</span>
                        <span className="text-sm truncate max-w-[150px]">{selectedFile.path}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => copyPathToClipboard(selectedFile.path)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Path
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="w-full"
                        onClick={() => handleDeleteFile(selectedFile)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Select a file to view its details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}