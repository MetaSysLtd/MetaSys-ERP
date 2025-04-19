import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";

// Types for CMS content
interface CMSContentItem {
  id: string;
  title: string;
  content: string;
  type: string;
  lastUpdated: string;
}

interface CMSSettings {
  siteName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeText: string;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    slack: boolean;
  }
}

export default function AdminCMS() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cmsContent, setCmsContent] = useState<CMSContentItem[]>([
    {
      id: "welcome",
      title: "Welcome Message",
      content: "Welcome to Metio ERP - Your complete enterprise resource planning solution.",
      type: "text",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "about",
      title: "About Us",
      content: "Metio ERP provides a comprehensive suite of tools for modern businesses.",
      type: "text",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      content: "Our privacy policy outlines how we collect and process your data.",
      type: "html",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "terms",
      title: "Terms of Service",
      content: "By using our services, you agree to the following terms and conditions.",
      type: "html",
      lastUpdated: new Date().toISOString()
    }
  ]);

  const [settings, setSettings] = useState<CMSSettings>({
    siteName: "Metio ERP",
    logo: "/src/assets/metio-logo.svg",
    primaryColor: "#2170dd",
    secondaryColor: "#4d9eff",
    welcomeText: "Welcome to Metio ERP Dashboard",
    notificationSettings: {
      email: true,
      sms: true,
      slack: false
    }
  });

  const [selectedContent, setSelectedContent] = useState<CMSContentItem | null>(null);

  // In a real application, this would fetch from your API
  useEffect(() => {
    const fetchCMSData = async () => {
      setIsLoading(true);
      try {
        // Mock API call - in a real app this would be:
        // const response = await apiRequest("GET", "/api/admin/cms");
        // setCmsContent(response.content);
        // setSettings(response.settings);
        
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Using initial state instead of API for demo
      } catch (error) {
        toast({
          title: "Error fetching CMS data",
          description: "There was a problem loading your CMS content.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCMSData();
  }, []);

  const handleContentSelect = (id: string) => {
    const content = cmsContent.find(item => item.id === id);
    if (content) {
      setSelectedContent(content);
    }
  };

  const handleContentUpdate = (field: string, value: string) => {
    if (!selectedContent) return;
    
    setSelectedContent({
      ...selectedContent,
      [field]: value,
      lastUpdated: new Date().toISOString()
    });
  };

  const handleSettingsUpdate = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationSettingUpdate = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [field]: value
      }
    }));
  };

  const saveContent = async () => {
    if (!selectedContent) return;
    
    setIsSaving(true);
    try {
      // Update local state
      setCmsContent(prev => 
        prev.map(item => 
          item.id === selectedContent.id ? selectedContent : item
        )
      );
      
      // In a real application, this would be an API call:
      // await apiRequest("PUT", `/api/admin/cms/content/${selectedContent.id}`, selectedContent);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast({
        title: "Content saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving content",
        description: "There was a problem saving your changes.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real application, this would be an API call:
      // await apiRequest("PUT", "/api/admin/cms/settings", settings);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user is admin
  useEffect(() => {
    if (user && user.roleId !== 1) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin CMS.",
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
            <h1 className="text-3xl font-bold tracking-tight">Admin CMS</h1>
            <p className="text-muted-foreground">
              Manage content and settings for your application
            </p>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Pages</CardTitle>
                    <CardDescription>
                      Select a page to edit its content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cmsContent.map(item => (
                        <div 
                          key={item.id}
                          className={`p-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${selectedContent?.id === item.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                          onClick={() => handleContentSelect(item.id)}
                        >
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Last updated: {new Date(item.lastUpdated).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedContent ? `Edit: ${selectedContent.title}` : 'Select content to edit'}
                    </CardTitle>
                    <CardDescription>
                      {selectedContent 
                        ? `Editing ${selectedContent.type === 'html' ? 'HTML content' : 'text content'}`
                        : 'Please select a content item from the list'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedContent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input 
                            id="title" 
                            value={selectedContent.title}
                            onChange={(e) => handleContentUpdate('title', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="content-type">Content Type</Label>
                          <Select 
                            value={selectedContent.type}
                            onValueChange={(value) => handleContentUpdate('type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Plain Text</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea 
                            id="content"
                            value={selectedContent.content}
                            onChange={(e) => handleContentUpdate('content', e.target.value)}
                            className="min-h-[200px]"
                          />
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={saveContent}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Please select a content item to edit
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Customize your application settings and appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input 
                        id="site-name" 
                        value={settings.siteName}
                        onChange={(e) => handleSettingsUpdate('siteName', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo-path">Logo Path</Label>
                      <Input 
                        id="logo-path" 
                        value={settings.logo}
                        onChange={(e) => handleSettingsUpdate('logo', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="primary-color" 
                            value={settings.primaryColor}
                            onChange={(e) => handleSettingsUpdate('primaryColor', e.target.value)}
                          />
                          <div 
                            className="w-10 h-10 rounded-md border"
                            style={{ backgroundColor: settings.primaryColor }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="secondary-color" 
                            value={settings.secondaryColor}
                            onChange={(e) => handleSettingsUpdate('secondaryColor', e.target.value)}
                          />
                          <div 
                            className="w-10 h-10 rounded-md border"
                            style={{ backgroundColor: settings.secondaryColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-text">Dashboard Welcome Text</Label>
                      <Textarea 
                        id="welcome-text"
                        value={settings.welcomeText}
                        onChange={(e) => handleSettingsUpdate('welcomeText', e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-base">Notification Settings</Label>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="email-notifications"
                            checked={settings.notificationSettings.email}
                            onChange={(e) => handleNotificationSettingUpdate('email', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="email-notifications" className="font-normal">
                            Email Notifications
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="sms-notifications"
                            checked={settings.notificationSettings.sms}
                            onChange={(e) => handleNotificationSettingUpdate('sms', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="sms-notifications" className="font-normal">
                            SMS Notifications
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="slack-notifications"
                            checked={settings.notificationSettings.slack}
                            onChange={(e) => handleNotificationSettingUpdate('slack', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="slack-notifications" className="font-normal">
                            Slack Notifications
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    className="w-full"
                    onClick={saveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Settings...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">User Management</h3>
                  <p className="text-muted-foreground mt-2">
                    User management is available through the main Admin dashboard.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/admin/users")}
                  >
                    Go to User Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>CMS Help & Documentation</CardTitle>
                <CardDescription>
                  Learn how to use the admin CMS effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Getting Started</h3>
                    <p className="text-muted-foreground mt-2">
                      Welcome to the Metio ERP Admin CMS. This tool allows you to manage content and settings for your application.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Content Management</h3>
                    <p className="text-muted-foreground mt-2">
                      The Content tab allows you to edit various pages and text throughout the application. Select a content item from the list
                      on the left, make your changes in the editor, and click Save Changes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Settings</h3>
                    <p className="text-muted-foreground mt-2">
                      The Settings tab allows you to customize the appearance and behavior of your application. Changes to settings will affect
                      all users of the application.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">User Management</h3>
                    <p className="text-muted-foreground mt-2">
                      User management is available through the Admin dashboard. You can create, edit, and deactivate user accounts,
                      as well as assign roles and permissions.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Need More Help?</h3>
                    <p className="text-muted-foreground mt-2">
                      For further assistance, please contact your system administrator or refer to the comprehensive documentation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}