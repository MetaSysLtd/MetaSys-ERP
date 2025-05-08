import React from 'react';
import { Helmet } from 'react-helmet';
import ComponentCatalog from '@/components/ui/catalog/ComponentCatalog';
import UsageGuidelines from '@/components/ui/catalog/UsageGuidelines';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Design System Page
 * 
 * This page serves as documentation for the MetaSys ERP design system
 * and provides a living reference of all UI components.
 */
const DesignSystemPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Design System | MetaSys ERP</title>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-primary">MetaSys ERP Design System</h1>
              {user && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Logged in as: {user.username}</div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main>
          <div className="container mx-auto py-8">
            <div className="space-y-6 mb-8">
              <h1>MetaSys ERP Design System</h1>
              <p className="text-gray-600 max-w-3xl">
                This design system establishes a shared UI component catalogue for MetaSys ERP.
                It ensures consistent look, feel, and behavior across the platform, speeds up feature development,
                and simplifies maintenance.
              </p>
            </div>

            <Tabs defaultValue="components" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="components">Component Catalog</TabsTrigger>
                <TabsTrigger value="guidelines">Usage Guidelines</TabsTrigger>
                <TabsTrigger value="tokens">Design Tokens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="components">
                <ComponentCatalog />
              </TabsContent>
              
              <TabsContent value="guidelines">
                <UsageGuidelines />
              </TabsContent>
              
              <TabsContent value="tokens" className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Design Tokens</h2>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Color Palette</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Primary Colors</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#1D3557] mr-3"></div>
                              <div>
                                <p className="font-medium">Primary Dark Blue</p>
                                <p className="text-sm text-gray-500">#1D3557</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#457B9D] mr-3"></div>
                              <div>
                                <p className="font-medium">Accent Bright Blue</p>
                                <p className="text-sm text-gray-500">#457B9D</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-3">Secondary Colors</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#2EC4B6] mr-3"></div>
                              <div>
                                <p className="font-medium">Highlight Aqua</p>
                                <p className="text-sm text-gray-500">#2EC4B6</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#FFDD57] mr-3"></div>
                              <div>
                                <p className="font-medium">Contrast Yellow</p>
                                <p className="text-sm text-gray-500">#FFDD57</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <h4 className="text-sm font-medium mb-3">UI Colors</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#F1FAFB] border border-gray-200 mr-3"></div>
                              <div>
                                <p className="font-medium">Background</p>
                                <p className="text-sm text-gray-500">#F1FAFB</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-white border border-[#D6D6D6] mr-3"></div>
                              <div>
                                <p className="font-medium">Surface</p>
                                <p className="text-sm text-gray-500">#FFFFFF</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-3">Text & Border</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded bg-[#1D3557] mr-3"></div>
                              <div>
                                <p className="font-medium">Text Dark</p>
                                <p className="text-sm text-gray-500">#1D3557</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded border-2 border-[#D6D6D6] mr-3"></div>
                              <div>
                                <p className="font-medium">Border</p>
                                <p className="text-sm text-gray-500">#D6D6D6</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Typography</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Font Family</h4>
                          <div className="bg-gray-50 rounded p-3">
                            <p className="font-medium">Inter, fallback sans-serif</p>
                            <p className="text-sm text-gray-500">
                              <code className="bg-gray-100 px-1 py-0.5 rounded">font-family: 'Inter', sans-serif;</code>
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-3">Font Weights</h4>
                          <div className="bg-gray-50 rounded p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-normal">Regular (400)</p>
                                <p className="text-sm text-gray-500">Body text</p>
                              </div>
                              <div>
                                <p className="font-medium">Medium (500)</p>
                                <p className="text-sm text-gray-500">Buttons, labels</p>
                              </div>
                              <div>
                                <p className="font-semibold">Semibold (600)</p>
                                <p className="text-sm text-gray-500">Subheadings</p>
                              </div>
                              <div>
                                <p className="font-bold">Bold (700)</p>
                                <p className="text-sm text-gray-500">Headings, emphasis</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Spacing & Borders</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium mb-3">Spacing Scale</h4>
                          <div className="bg-gray-50 rounded p-3 space-y-2">
                            <p>Base unit: 8px (with 4px for very small gaps)</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>4px (--space-1)</li>
                              <li>8px (--space-2)</li>
                              <li>16px (--space-3)</li>
                              <li>24px (--space-4)</li>
                              <li>32px (--space-5)</li>
                              <li>40px (--space-6)</li>
                              <li>48px (--space-7)</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-3">Borders & Shadows</h4>
                          <div className="bg-gray-50 rounded p-3 space-y-2">
                            <p className="font-medium">Border Radius</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>4px for inputs/cards</li>
                              <li>8px for buttons</li>
                            </ul>
                            
                            <p className="font-medium mt-3">Shadows</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Subtle: 0px 2px 4px rgba(0,0,0,0.05)</li>
                              <li>Deeper: 0px 4px 8px rgba(0,0,0,0.1)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <footer className="border-t border-gray-200 py-6 mt-12">
          <div className="container mx-auto">
            <div className="text-center text-sm text-gray-500">
              <p>MetaSys ERP Design System v1.0</p>
              <p>Based on Phase 1 Core Design System</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DesignSystemPage;