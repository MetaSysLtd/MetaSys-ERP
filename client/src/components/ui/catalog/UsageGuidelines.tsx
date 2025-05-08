import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Component Usage Guidelines
 * This component provides documented rules and examples for proper usage of UI components
 */
const UsageGuidelines = () => {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="space-y-4">
        <h1>Component Usage Guidelines</h1>
        <p className="text-gray-600 max-w-3xl">
          These guidelines outline best practices for using components in the MetaSys ERP system.
          Following these standards ensures consistency and quality across the platform.
        </p>
      </div>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        {/* BUTTONS GUIDELINES */}
        <TabsContent value="buttons" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Button Usage</CardTitle>
              <CardDescription>
                Guidelines for using different button types in the interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Button Type</TableHead>
                    <TableHead>When to Use</TableHead>
                    <TableHead>When Not to Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Primary</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Main call-to-action on a page</li>
                        <li>Primary user flows (Save, Submit, Next)</li>
                        <li>Limit to one primary button per view</li>
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Secondary actions</li>
                        <li>Multiple primary buttons in same area</li>
                        <li>Destructive actions (use destructive variant)</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Secondary</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Secondary actions</li>
                        <li>Alternative options (Cancel, Back)</li>
                        <li>When paired with a primary button</li>
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Main page actions</li>
                        <li>When you need maximum visual emphasis</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Outline/Ghost</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Tertiary actions with low emphasis</li>
                        <li>In toolbars or button groups</li>
                        <li>Side panel or card actions</li>
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Primary user flows</li>
                        <li>When strong emphasis is needed</li>
                        <li>Forms' primary submission</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Destructive</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Delete or remove actions</li>
                        <li>Irreversible actions</li>
                        <li>Actions requiring caution</li>
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Regular navigation</li>
                        <li>Non-destructive actions</li>
                        <li>Cancel actions (use secondary instead)</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="space-y-4 pt-4">
                <h4>Button Spacing & Placement</h4>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Do: Consistent Order</h5>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex justify-end gap-3">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save</Button>
                      </div>
                      <div className="text-sm text-green-700 mt-2 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Always place Cancel to the left of Save/Submit
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Don't: Inconsistent Order</h5>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex justify-end gap-3">
                        <Button>Save</Button>
                        <Button variant="outline">Cancel</Button>
                      </div>
                      <div className="text-sm text-red-700 mt-2 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Don't reverse the standard order
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMS GUIDELINES */}
        <TabsContent value="forms" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Form Components Usage</CardTitle>
              <CardDescription>
                Guidelines for form fields, layout, and validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4>Form Layout</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Do: Consistent Layout</h5>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="Enter your name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-green-700 mt-4 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Labels above fields, consistent spacing
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Don't: Inconsistent Layout</h5>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <label className="text-sm font-medium w-1/3">Full Name:</label>
                          <input 
                            type="text" 
                            className="w-2/3 px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="Enter your name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-red-700 mt-4 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Don't mix horizontal and vertical layouts
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h4>Form Validation</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Do: Clear Validation</h5>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500" 
                          placeholder="Enter password"
                        />
                        <p className="text-sm text-red-600">Password must be at least 8 characters</p>
                      </div>
                      <div className="text-sm text-green-700 mt-4 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Specific error message with visual indicator
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Don't: Vague Validation</h5>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input 
                          type="password" 
                          className="w-full px-3 py-2 border border-red-300 rounded-md" 
                          placeholder="Enter password"
                        />
                        <p className="text-sm text-red-600">Invalid input</p>
                      </div>
                      <div className="text-sm text-red-700 mt-4 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Don't use vague error messages
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LAYOUT GUIDELINES */}
        <TabsContent value="layout" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Layout Guidelines</CardTitle>
              <CardDescription>
                Standards for page structure, spacing, and component placement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4>Spacing</h4>
                <p>
                  Use the spacing scale consistently throughout the application. 
                  Our spacing scale is based on multiples of 8px (with 4px for very small gaps).
                </p>
                
                <div className="flex flex-wrap gap-8 mt-4">
                  <div className="space-y-1 text-center">
                    <div className="h-4 w-4 bg-gray-200 mx-auto"></div>
                    <p className="text-xs text-gray-600">4px</p>
                    <p className="text-xs text-gray-500">space-1</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="h-8 w-8 bg-gray-200 mx-auto"></div>
                    <p className="text-xs text-gray-600">8px</p>
                    <p className="text-xs text-gray-500">space-2</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="h-16 w-16 bg-gray-200 mx-auto"></div>
                    <p className="text-xs text-gray-600">16px</p>
                    <p className="text-xs text-gray-500">space-3</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="h-24 w-24 bg-gray-200 mx-auto"></div>
                    <p className="text-xs text-gray-600">24px</p>
                    <p className="text-xs text-gray-500">space-4</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="h-32 w-32 bg-gray-200 mx-auto"></div>
                    <p className="text-xs text-gray-600">32px</p>
                    <p className="text-xs text-gray-500">space-5</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h4>Container Usage</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Standard Page Layout</h5>
                    <div className="border border-gray-200 rounded-md p-4">
                      <div className="bg-gray-100 p-4 mb-4 text-center">Page Header</div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1 bg-gray-100 p-4 h-48 text-center">Sidebar</div>
                        <div className="col-span-3 bg-white border border-dashed border-gray-300 p-4 h-48 flex items-center justify-center">
                          Main Content
                        </div>
                      </div>
                      <div className="bg-gray-100 p-4 text-center">Page Footer</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Card Layout</h5>
                    <div className="border border-gray-200 rounded-md p-4">
                      <div className="bg-gray-100 p-4 mb-4 text-center">Page Header</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 bg-white border border-gray-200 rounded-md p-4 h-24 shadow-sm text-center">
                          Card 1
                        </div>
                        <div className="col-span-1 bg-white border border-gray-200 rounded-md p-4 h-24 shadow-sm text-center">
                          Card 2
                        </div>
                        <div className="col-span-1 bg-white border border-gray-200 rounded-md p-4 h-24 shadow-sm text-center">
                          Card 3
                        </div>
                        <div className="col-span-3 bg-white border border-gray-200 rounded-md p-4 h-32 shadow-sm text-center">
                          Full Width Card
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCESSIBILITY GUIDELINES */}
        <TabsContent value="accessibility" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Guidelines</CardTitle>
              <CardDescription>
                Standards to ensure the application is accessible to all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accessibility Requirement</TableHead>
                    <TableHead>Implementation Standard</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Color Contrast</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Text must have contrast ratio of at least 4.5:1 against backgrounds</li>
                        <li>Large text (18pt+) must have contrast ratio of at least 3:1</li>
                        <li>UI components and graphics must have contrast ratio of at least 3:1</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Keyboard Navigation</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>All interactive elements must be accessible via keyboard</li>
                        <li>Tab order must follow logical reading sequence</li>
                        <li>Focus states must be visually apparent</li>
                        <li>Custom components must support keyboard interaction patterns</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Screen Readers</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>All images must have descriptive alt text</li>
                        <li>Forms must have properly associated labels</li>
                        <li>ARIA attributes must be used when appropriate</li>
                        <li>Dynamic content changes must be announced to screen readers</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Content Structure</TableCell>
                    <TableCell>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Headings must follow hierarchical structure (h1, then h2, etc.)</li>
                        <li>Lists must use proper list markup (ul, ol, li)</li>
                        <li>Tables must include proper headers and structure</li>
                        <li>Page language must be specified</li>
                      </ul>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="space-y-4 pt-6">
                <h4>Focus Management</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Do: Visible Focus</h5>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <Button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Focused Button
                      </Button>
                      <div className="text-sm text-green-700 mt-4 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Clear focus indicator with sufficient contrast
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium">Don't: No Focus Indicator</h5>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <Button className="focus:outline-none">
                        Focused Button
                      </Button>
                      <div className="text-sm text-red-700 mt-4 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Don't remove focus outlines without an alternative
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsageGuidelines;