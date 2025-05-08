import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Theme type definition
interface ThemeConfig {
  variant: "tint" | "professional" | "vibrant";
  primary: string;
  secondary: string;
  appearance: "light" | "dark" | "system";
  radius: number;
  colors: {
    "brand-navy": string;
    "brand-accent": string;
    "brand-highlight": string;
    "brand-contrast": string;
    "brand-background": string;
    "brand-border": string;
    "brand-text": string;
  };
}

// Props for the component
interface ThemeCustomizerProps {
  currentTheme: ThemeConfig;
  isAdmin?: boolean;
}

export default function ThemeCustomizer({ currentTheme, isAdmin = false }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<ThemeConfig>(currentTheme);
  const [activeTab, setActiveTab] = useState("colors");
  const { toast } = useToast();

  // Update theme when currentTheme changes (e.g., on initial load)
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  // Helper to update color values
  const updateColor = (key: keyof ThemeConfig["colors"], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  // Update CSS variables when theme changes
  useEffect(() => {
    // Get the document's root element to update CSS variables
    const root = document.documentElement;

    // Update primary and secondary base colors
    root.style.setProperty("--primary", theme.colors["brand-navy"]);
    root.style.setProperty("--secondary", theme.colors["brand-accent"]);
    
    // Update brand colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Update border radius
    root.style.setProperty("--radius", `${theme.radius}rem`);
  }, [theme]);

  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async (themeData: ThemeConfig) => {
      return await apiRequest("POST", "/api/theme", themeData);
    },
    onSuccess: () => {
      toast({
        title: "Theme saved",
        description: "Your theme changes have been applied and saved.",
      });
      
      // Update theme.json on the server
      queryClient.invalidateQueries({ queryKey: ["/api/theme"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save theme. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset theme to defaults
  const handleReset = () => {
    setTheme(currentTheme);
    toast({
      title: "Theme reset",
      description: "Theme has been reset to default values.",
    });
  };

  // Save theme
  const handleSave = () => {
    saveThemeMutation.mutate(theme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
        <CardDescription>
          Customize the appearance of the MetaSys ERP platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="spacing">Spacing & Radius</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Primary Colors</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand-navy">Primary Dark Blue</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-navy"] }}
                      />
                      <Input
                        id="brand-navy"
                        value={theme.colors["brand-navy"]}
                        onChange={(e) => updateColor("brand-navy", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="brand-accent">Accent Bright Blue</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-accent"] }}
                      />
                      <Input
                        id="brand-accent"
                        value={theme.colors["brand-accent"]}
                        onChange={(e) => updateColor("brand-accent", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Secondary Colors</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand-highlight">Highlight Aqua</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-highlight"] }}
                      />
                      <Input
                        id="brand-highlight"
                        value={theme.colors["brand-highlight"]}
                        onChange={(e) => updateColor("brand-highlight", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="brand-contrast">Contrast Yellow</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-contrast"] }}
                      />
                      <Input
                        id="brand-contrast"
                        value={theme.colors["brand-contrast"]}
                        onChange={(e) => updateColor("brand-contrast", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <h3 className="text-lg font-medium mb-4">UI Colors</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand-background">Background</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-background"] }}
                      />
                      <Input
                        id="brand-background"
                        value={theme.colors["brand-background"]}
                        onChange={(e) => updateColor("brand-background", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="brand-border">Border</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-border"] }}
                      />
                      <Input
                        id="brand-border"
                        value={theme.colors["brand-border"]}
                        onChange={(e) => updateColor("brand-border", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Text Colors</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand-text">Text</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: theme.colors["brand-text"] }}
                      />
                      <Input
                        id="brand-text"
                        value={theme.colors["brand-text"]}
                        onChange={(e) => updateColor("brand-text", e.target.value)}
                        readOnly={!isAdmin}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="typography" className="pt-4">
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
              <p className="text-sm text-yellow-800">
                Typography customization will be available in a future update. For now, the system uses Inter font family with a range of weights.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="spacing" className="pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="radius">Border Radius (rem)</Label>
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    id="radius"
                    type="number"
                    min="0"
                    max="2"
                    step="0.125"
                    value={theme.radius}
                    onChange={(e) => setTheme(prev => ({
                      ...prev,
                      radius: parseFloat(e.target.value)
                    }))}
                    readOnly={!isAdmin}
                    disabled={!isAdmin}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Controls the roundness of UI elements like buttons and cards.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {isAdmin && (
          <div className="mt-6 flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              className="gap-1"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button 
              className="gap-1 bg-[#025E73] hover:bg-[#025E73]/90"
              onClick={handleSave}
              disabled={saveThemeMutation.isPending}
            >
              {saveThemeMutation.isPending ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-r-transparent border-white/80"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        )}
        
        {!isAdmin && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Only System Administrators can modify theme settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}