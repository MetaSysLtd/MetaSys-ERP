import React from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  XCircle,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Download,
  Upload,
  ChevronDown,
  User,
  Mail
} from 'lucide-react';

/**
 * Component Catalog - A showcase of all available UI components according to the Phase 1 design system
 * This serves as both documentation and a reference for developers
 */
const ComponentCatalog = () => {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="space-y-4">
        <h1>MetaSys ERP Component Catalog</h1>
        <p className="text-gray-600 max-w-3xl">
          This catalog serves as a reference for all shared UI components in the MetaSys ERP system.
          All components adhere to our design system standards for consistency across the platform.
        </p>
      </div>

      <Tabs defaultValue="typography" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* TYPOGRAPHY SECTION */}
        <TabsContent value="typography" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>
                Font family: Inter, fallback sans-serif. Line heights and font weights are pre-configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h1>H1: Main Page Headings (32px/40px)</h1>
                <h2>H2: Section Headings (24px/32px)</h2>
                <h3>H3: Subsection Headings (20px/28px)</h3>
                <h4>H4: Card Headings (18px/24px)</h4>
                <h5>H5: Minor Headings (16px/24px)</h5>
                <h6>H6: Small Headings (14px/20px)</h6>
                <p>Body Text: Regular content text (16px/24px)</p>
                <p className="text-small">Small Text: Secondary content, captions (14px/20px)</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-32 flex-shrink-0">Normal (400)</div>
                  <p className="font-normal">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 flex-shrink-0">Medium (500)</div>
                  <p className="font-medium">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 flex-shrink-0">Semibold (600)</div>
                  <p className="font-semibold">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 flex-shrink-0">Bold (700)</div>
                  <p className="font-bold">The quick brown fox jumps over the lazy dog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUTTONS SECTION */}
        <TabsContent value="buttons" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                Use the appropriate button variant based on importance and context. 
                Stick to one primary button per section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <h4>Primary</h4>
                  <div className="space-y-2">
                    <Button variant="default">Default</Button>
                    <Button variant="default" disabled>Disabled</Button>
                    <Button variant="default" size="sm">Small</Button>
                    <Button variant="default" size="lg">Large</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4>Secondary</h4>
                  <div className="space-y-2">
                    <Button variant="secondary">Default</Button>
                    <Button variant="secondary" disabled>Disabled</Button>
                    <Button variant="secondary" size="sm">Small</Button>
                    <Button variant="secondary" size="lg">Large</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4>Outline</h4>
                  <div className="space-y-2">
                    <Button variant="outline">Default</Button>
                    <Button variant="outline" disabled>Disabled</Button>
                    <Button variant="outline" size="sm">Small</Button>
                    <Button variant="outline" size="lg">Large</Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4>Ghost</h4>
                  <div className="space-y-2">
                    <Button variant="ghost">Default</Button>
                    <Button variant="ghost" disabled>Disabled</Button>
                    <Button variant="ghost" size="sm">Small</Button>
                    <Button variant="ghost" size="lg">Large</Button>
                  </div>
                </div>
              </div>
              
              <Separator className="my-8" />
              
              <div className="space-y-6">
                <h4>Button With Icons</h4>
                <div className="flex flex-wrap gap-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add New
                  </Button>
                  <Button variant="secondary">
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Settings
                  </Button>
                  <Button variant="ghost">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button variant="ghost">
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
              
              <Separator className="my-8" />
              
              <div className="space-y-6">
                <h4>Destructive Actions</h4>
                <div className="flex flex-wrap gap-4">
                  <Button variant="destructive">Delete</Button>
                  <Button variant="destructive" disabled>Disabled</Button>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-gray-500">
                Always use button elements for actions and a elements for navigation.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* INPUTS SECTION */}
        <TabsContent value="inputs" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>
                Form controls for user input, following our design system standards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-input">Text Input</Label>
                    <Input id="default-input" placeholder="Enter text" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disabled-input">Disabled Input</Label>
                    <Input id="disabled-input" placeholder="Disabled" disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="with-icon-input">Input with Icon</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input id="with-icon-input" className="pl-8" placeholder="Username" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="error-input">Error Input</Label>
                    <Input 
                      id="error-input" 
                      placeholder="Error state" 
                      className="border-red-500 focus-visible:ring-red-500" 
                    />
                    <p className="text-sm text-red-500">This field is required</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-select">Select Input</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Checkbox</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="checkbox-1" />
                        <Label htmlFor="checkbox-1">Option 1</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="checkbox-2" checked />
                        <Label htmlFor="checkbox-2">Option 2 (Selected)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="checkbox-3" disabled />
                        <Label htmlFor="checkbox-3" className="text-gray-400">Option 3 (Disabled)</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Radio Group</Label>
                    <RadioGroup defaultValue="option1">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="radio-1" value="option1" />
                        <Label htmlFor="radio-1">Option 1</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="radio-2" value="option2" />
                        <Label htmlFor="radio-2">Option 2</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="radio-3" value="option3" disabled />
                        <Label htmlFor="radio-3" className="text-gray-400">Option 3 (Disabled)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toggle">Toggle Switch</Label>
                    <div className="flex items-center gap-2">
                      <Switch id="toggle" />
                      <Label htmlFor="toggle">Enable feature</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BADGES SECTION */}
        <TabsContent value="badges" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Status Badges & Tags</CardTitle>
              <CardDescription>
                Use badges to highlight status, labels, or counts. Keep them concise and meaningful.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h4 className="mb-4">Status Badges</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-4">Custom Status Colors</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Pending</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Processing</Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Failed</Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">New</Badge>
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">Inactive</Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-4">Badge with Icon</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      <AlertCircle className="mr-1 h-3 w-3" /> Warning
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      <Info className="mr-1 h-3 w-3" /> Info
                    </Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      <XCircle className="mr-1 h-3 w-3" /> Rejected
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-4">Badge Sizes</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge className="text-xs px-1.5 py-0.5">Small</Badge>
                    <Badge>Default</Badge>
                    <Badge className="text-base px-3 py-1">Large</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CARDS SECTION */}
        <TabsContent value="cards" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Card Components</CardTitle>
              <CardDescription>
                Cards group related content and actions. They provide a consistent way to display information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                    <CardDescription>A simple card with header and content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This is the main content area of the card.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Card with actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card with a call to action in the footer.</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost">Cancel</Button>
                    <Button>Action</Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-t-4 border-t-brandNavy">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Featured Card</CardTitle>
                        <CardDescription>With highlight & badge</CardDescription>
                      </div>
                      <Badge>New</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>Cards can include badges and borders to highlight importance.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Learn More</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEEDBACK SECTION */}
        <TabsContent value="feedback" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Feedback & Status Components</CardTitle>
              <CardDescription>
                Components that provide user feedback, alerts, and status indicators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h4>Alert Indicators</h4>
                <div className="space-y-4">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                      <div>
                        <h5 className="font-medium text-green-800">Success Alert</h5>
                        <p className="text-green-700">Operation completed successfully.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                      <div>
                        <h5 className="font-medium text-blue-800">Information Alert</h5>
                        <p className="text-blue-700">This is an informational message.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                      <div>
                        <h5 className="font-medium text-yellow-800">Warning Alert</h5>
                        <p className="text-yellow-700">Please review the information carefully.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                      <div>
                        <h5 className="font-medium text-red-800">Error Alert</h5>
                        <p className="text-red-700">An error occurred. Please try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4>Status Indicators</h4>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                    <span>Offline</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-gray-400 mr-2"></span>
                    <span>Inactive</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                    <span>Processing</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4>Progress Indicators</h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Basic Progress (75%)</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Success Progress (100%)</span>
                      <span className="text-sm font-medium">Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full w-full"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Warning Progress (40%)</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
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

export default ComponentCatalog;