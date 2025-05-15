import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import ThemeCustomizer from "@/components/ui/theme-customizer";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";

export default function DesignSystemPage() {
  const { user, role } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="bg-white shadow flex-shrink-0">
        <div className="px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/settings?tab=design-system")}
                className="mr-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </Button>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Design System
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 md:py-6 flex-grow overflow-y-auto">
        <Tabs defaultValue="theme" className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="theme">
            <div className="max-w-5xl mx-auto">
              <ThemeCustomizer 
                currentTheme={{
                  variant: "professional",
                  primary: "#1D3557",
                  secondary: "#457B9D",
                  appearance: "light",
                  radius: 0.5,
                  colors: {
                    "brand-navy": "#1D3557",
                    "brand-accent": "#457B9D",
                    "brand-highlight": "#2EC4B6",
                    "brand-contrast": "#FFDD57",
                    "brand-background": "#F1FAFB",
                    "brand-border": "#D6D6D6",
                    "brand-text": "#333333"
                  }
                }}
                isAdmin={role && role.level >= 5}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="typography">
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Guidelines</CardTitle>
                  <CardDescription>
                    Consistent typography creates a clear hierarchy and improves readability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Heading 1 (32px/40px)</h1>
                      <p className="text-gray-500">Font weight: 700 (Bold)</p>
                    </div>
                    
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Heading 2 (28px/36px)</h2>
                      <p className="text-gray-500">Font weight: 700 (Bold)</p>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Heading 3 (24px/32px)</h3>
                      <p className="text-gray-500">Font weight: 600 (Semibold)</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Heading 4 (20px/28px)</h4>
                      <p className="text-gray-500">Font weight: 600 (Semibold)</p>
                    </div>
                    
                    <div>
                      <h5 className="text-lg font-medium mb-2">Heading 5 (18px/24px)</h5>
                      <p className="text-gray-500">Font weight: 500 (Medium)</p>
                    </div>
                    
                    <div>
                      <p className="text-base mb-2">Body text (16px/24px)</p>
                      <p className="text-gray-500">Font weight: 400 (Regular)</p>
                    </div>
                    
                    <div>
                      <p className="text-sm mb-2">Small text (14px/20px)</p>
                      <p className="text-gray-500">Font weight: 400 (Regular)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Font Family</CardTitle>
                  <CardDescription>
                    Inter font family is used throughout the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-bold mb-1">Inter (Primary Font)</p>
                    <p className="text-gray-500 text-sm">
                      A clean and modern sans-serif typeface designed for screen readability
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 border rounded-md">
                      <p className="font-normal mb-2">Regular (400)</p>
                      <p className="text-gray-800">
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="font-medium mb-2">Medium (500)</p>
                      <p className="text-gray-800 font-medium">
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="font-semibold mb-2">Semibold (600)</p>
                      <p className="text-gray-800 font-semibold">
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <p className="font-bold mb-2">Bold (700)</p>
                      <p className="text-gray-800 font-bold">
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="colors">
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Color System</CardTitle>
                  <CardDescription>
                    Our color palette is designed for clarity, consistency, and accessibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Primary Colors</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="h-12 rounded-md bg-[#1D3557]"></div>
                          <div className="mt-1">
                            <p className="font-medium">Primary Dark Blue</p>
                            <p className="text-sm text-gray-500">#1D3557</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="h-12 rounded-md bg-[#457B9D]"></div>
                          <div className="mt-1">
                            <p className="font-medium">Accent Bright Blue</p>
                            <p className="text-sm text-gray-500">#457B9D</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Accent Colors</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="h-12 rounded-md bg-[#2EC4B6]"></div>
                          <div className="mt-1">
                            <p className="font-medium">Highlight Aqua</p>
                            <p className="text-sm text-gray-500">#2EC4B6</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="h-12 rounded-md bg-[#FFDD57]"></div>
                          <div className="mt-1">
                            <p className="font-medium">Contrast Yellow</p>
                            <p className="text-sm text-gray-500">#FFDD57</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Background</h3>
                      <div className="h-12 rounded-md bg-[#F1FAFB] border"></div>
                      <div className="mt-1">
                        <p className="font-medium">Light Background</p>
                        <p className="text-sm text-gray-500">#F1FAFB</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Border</h3>
                      <div className="h-12 rounded-md border-4 border-[#D6D6D6]"></div>
                      <div className="mt-1">
                        <p className="font-medium">Border Gray</p>
                        <p className="text-sm text-gray-500">#D6D6D6</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Text</h3>
                      <div className="h-12 rounded-md bg-[#333333]"></div>
                      <div className="mt-1">
                        <p className="font-medium">Text Dark</p>
                        <p className="text-sm text-gray-500">#333333</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Usage Guidelines</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      <li>Use Primary Dark Blue for major UI elements and important actions</li>
                      <li>Use Accent Bright Blue for secondary actions and interactive elements</li>
                      <li>Use Highlight Aqua for success states and positive indicators</li>
                      <li>Use Contrast Yellow for warnings, notifications, and to draw attention</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="components">
            <div className="max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Component Library</CardTitle>
                  <CardDescription>
                    Examples of core UI components used throughout the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-12">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Buttons</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-3">
                          <Button className="w-full">Default</Button>
                          <p className="text-sm text-gray-500">Primary action button</p>
                        </div>
                        <div className="space-y-3">
                          <Button variant="secondary" className="w-full">Secondary</Button>
                          <p className="text-sm text-gray-500">Secondary action button</p>
                        </div>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full">Outline</Button>
                          <p className="text-sm text-gray-500">Lower emphasis action</p>
                        </div>
                        <div className="space-y-3">
                          <Button variant="ghost" className="w-full">Ghost</Button>
                          <p className="text-sm text-gray-500">Minimal visual emphasis</p>
                        </div>
                        <div className="space-y-3">
                          <Button variant="link" className="w-full">Link</Button>
                          <p className="text-sm text-gray-500">Appears as a link</p>
                        </div>
                        <div className="space-y-3">
                          <Button disabled className="w-full">Disabled</Button>
                          <p className="text-sm text-gray-500">Button in disabled state</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Inputs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label htmlFor="example-input" className="mb-2">Text Input</Label>
                          <Input id="example-input" placeholder="Enter text..." />
                          <p className="text-sm text-gray-500 mt-2">Standard text input field</p>
                        </div>
                        <div>
                          <Label htmlFor="example-select" className="mb-2">Select Input</Label>
                          <Select>
                            <SelectTrigger id="example-select">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="option1">Option 1</SelectItem>
                              <SelectItem value="option2">Option 2</SelectItem>
                              <SelectItem value="option3">Option 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-2">Dropdown selection field</p>
                        </div>
                        <div>
                          <Label htmlFor="disabled-input" className="mb-2">Disabled Input</Label>
                          <Input id="disabled-input" placeholder="This input is disabled" disabled />
                          <p className="text-sm text-gray-500 mt-2">Disabled input field</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Cards</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Simple Card</CardTitle>
                            <CardDescription>Card with minimal content</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>This is a basic card component used for displaying content in a contained format.</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Interactive Card</CardTitle>
                            <CardDescription>Card with actions</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Cards can contain various interactive elements like buttons.</p>
                          </CardContent>
                          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                            <Button variant="outline">Cancel</Button>
                            <Button>Save</Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Design Principles</CardTitle>
                  <CardDescription>
                    Core principles guiding the MetaSys ERP design system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Consistency</h3>
                      <p className="text-gray-700">
                        Maintain visual and functional consistency across the platform to reduce learning curve and cognitive load.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Clarity</h3>
                      <p className="text-gray-700">
                        Present information and actions in a clear, concise manner that is easy to understand and interact with.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Efficiency</h3>
                      <p className="text-gray-700">
                        Design interfaces that help users complete tasks with minimal effort and maximum productivity.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Accessibility</h3>
                      <p className="text-gray-700">
                        Ensure interfaces are usable by people with diverse abilities and across various devices and environments.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}