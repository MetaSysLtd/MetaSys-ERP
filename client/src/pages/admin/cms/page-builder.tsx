import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save, Plus, Trash2, MoveUp, MoveDown, Eye, EyeOff, Image, Type, Layout } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";

// Component types
interface ComponentBase {
  id: string;
  type: string;
  visible: boolean;
}

interface HeadingComponent extends ComponentBase {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

interface TextComponent extends ComponentBase {
  type: 'text';
  content: string;
}

interface ImageComponent extends ComponentBase {
  type: 'image';
  src: string;
  alt: string;
}

interface ButtonComponent extends ComponentBase {
  type: 'button';
  text: string;
  url: string;
  variant: 'default' | 'outline' | 'destructive';
}

interface ContainerComponent extends ComponentBase {
  type: 'container';
  children: PageComponent[];
  layout: 'vertical' | 'horizontal';
}

type PageComponent = HeadingComponent | TextComponent | ImageComponent | ButtonComponent | ContainerComponent;

// Page type
interface Page {
  id: string;
  title: string;
  slug: string;
  components: PageComponent[];
  createdAt: string;
  updatedAt: string;
}

export default function PageBuilder() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Demo page
  const [page, setPage] = useState<Page>({
    id: "home",
    title: "Home Page",
    slug: "home",
    components: [
      {
        id: "header-1",
        type: "heading",
        content: "Welcome to Metio ERP",
        level: 1,
        visible: true
      },
      {
        id: "text-1",
        type: "text",
        content: "Your comprehensive enterprise resource planning solution for modern businesses.",
        visible: true
      },
      {
        id: "container-1",
        type: "container",
        layout: "horizontal",
        visible: true,
        children: [
          {
            id: "image-1",
            type: "image",
            src: "/src/assets/metio-logo.svg",
            alt: "Metio ERP Logo",
            visible: true
          },
          {
            id: "text-2",
            type: "text",
            content: "Metio ERP provides a complete solution for managing your business operations, from sales and dispatch to invoicing and reporting.",
            visible: true
          }
        ]
      },
      {
        id: "button-1",
        type: "button",
        text: "Learn More",
        url: "/about",
        variant: "default",
        visible: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Update page meta information
  const updatePageMeta = (field: keyof Page, value: string) => {
    setPage(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  // Add a new component to the page
  const addComponent = (type: PageComponent['type'], parentId?: string) => {
    const newId = `${type}-${Date.now()}`;
    let newComponent: PageComponent;
    
    switch (type) {
      case 'heading':
        newComponent = {
          id: newId,
          type: 'heading',
          content: 'New Heading',
          level: 2,
          visible: true
        };
        break;
      case 'text':
        newComponent = {
          id: newId,
          type: 'text',
          content: 'New text content',
          visible: true
        };
        break;
      case 'image':
        newComponent = {
          id: newId,
          type: 'image',
          src: '/src/assets/metio-logo.svg',
          alt: 'Image description',
          visible: true
        };
        break;
      case 'button':
        newComponent = {
          id: newId,
          type: 'button',
          text: 'Button Text',
          url: '#',
          variant: 'default',
          visible: true
        };
        break;
      case 'container':
        newComponent = {
          id: newId,
          type: 'container',
          children: [],
          layout: 'vertical',
          visible: true
        };
        break;
      default:
        return;
    }
    
    // If parentId is provided, add as a child to that container
    if (parentId) {
      setPage(prev => {
        const updatedComponents = [...prev.components];
        
        // Helper function to recursively find and update the target container
        const updateContainer = (components: PageComponent[]): PageComponent[] => {
          return components.map(component => {
            if (component.id === parentId && component.type === 'container') {
              return {
                ...component,
                children: [...(component as ContainerComponent).children, newComponent]
              };
            } else if (component.type === 'container') {
              return {
                ...component,
                children: updateContainer((component as ContainerComponent).children)
              };
            }
            return component;
          });
        };
        
        return {
          ...prev,
          components: updateContainer(updatedComponents),
          updatedAt: new Date().toISOString()
        };
      });
    } else {
      // Add to root level
      setPage(prev => ({
        ...prev,
        components: [...prev.components, newComponent],
        updatedAt: new Date().toISOString()
      }));
    }
  };

  // Update a component
  const updateComponent = (componentId: string, updates: Partial<PageComponent>) => {
    setPage(prev => {
      // Helper function to recursively find and update the component
      const updateComponents = (components: PageComponent[]): PageComponent[] => {
        return components.map(component => {
          if (component.id === componentId) {
            return { ...component, ...updates };
          } else if (component.type === 'container') {
            return {
              ...component,
              children: updateComponents((component as ContainerComponent).children)
            };
          }
          return component;
        });
      };
      
      return {
        ...prev,
        components: updateComponents(prev.components),
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Remove a component
  const removeComponent = (componentId: string) => {
    setPage(prev => {
      // Helper function to recursively filter out the component
      const filterComponents = (components: PageComponent[]): PageComponent[] => {
        return components
          .filter(component => component.id !== componentId)
          .map(component => {
            if (component.type === 'container') {
              return {
                ...component,
                children: filterComponents((component as ContainerComponent).children)
              };
            }
            return component;
          });
      };
      
      return {
        ...prev,
        components: filterComponents(prev.components),
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Move a component up or down
  const moveComponent = (componentId: string, direction: 'up' | 'down') => {
    setPage(prev => {
      // Helper function to recursively find and move the component
      const moveInList = (components: PageComponent[]): PageComponent[] => {
        const index = components.findIndex(c => c.id === componentId);
        
        if (index === -1) {
          // Component not found at this level, check containers
          return components.map(component => {
            if (component.type === 'container') {
              return {
                ...component,
                children: moveInList((component as ContainerComponent).children)
              };
            }
            return component;
          });
        }
        
        // Can't move if already at the edge
        if ((direction === 'up' && index === 0) || 
            (direction === 'down' && index === components.length - 1)) {
          return components;
        }
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const result = [...components];
        
        // Swap components
        [result[index], result[newIndex]] = [result[newIndex], result[index]];
        
        return result;
      };
      
      return {
        ...prev,
        components: moveInList(prev.components),
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Toggle component visibility
  const toggleComponentVisibility = (componentId: string) => {
    setPage(prev => {
      // Helper function to recursively find and toggle the component
      const toggleVisibility = (components: PageComponent[]): PageComponent[] => {
        return components.map(component => {
          if (component.id === componentId) {
            return { ...component, visible: !component.visible };
          } else if (component.type === 'container') {
            return {
              ...component,
              children: toggleVisibility((component as ContainerComponent).children)
            };
          }
          return component;
        });
      };
      
      return {
        ...prev,
        components: toggleVisibility(prev.components),
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Save the page
  const savePage = async () => {
    setIsSaving(true);
    try {
      // In a real application, this would be an API call:
      // await apiRequest("PUT", `/api/admin/pages/${page.id}`, page);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Page saved",
        description: "Your page has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving page",
        description: "There was a problem saving your page.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Component Editor
  const ComponentEditor = ({ component }: { component: PageComponent }) => {
    switch (component.type) {
      case 'heading':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Heading Text</Label>
              <Input 
                value={(component as HeadingComponent).content}
                onChange={(e) => updateComponent(component.id, { content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Heading Level</Label>
              <select 
                value={(component as HeadingComponent).level}
                onChange={(e) => updateComponent(component.id, { level: parseInt(e.target.value) as 1|2|3|4|5|6 })}
                className="w-full p-2 border rounded"
              >
                <option value={1}>H1 - Main Heading</option>
                <option value={2}>H2 - Section Heading</option>
                <option value={3}>H3 - Subsection Heading</option>
                <option value={4}>H4 - Minor Heading</option>
                <option value={5}>H5 - Small Heading</option>
                <option value={6}>H6 - Smallest Heading</option>
              </select>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Text Content</Label>
              <Textarea 
                value={(component as TextComponent).content}
                onChange={(e) => updateComponent(component.id, { content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Image Source</Label>
              <Input 
                value={(component as ImageComponent).src}
                onChange={(e) => updateComponent(component.id, { src: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input 
                value={(component as ImageComponent).alt}
                onChange={(e) => updateComponent(component.id, { alt: e.target.value })}
              />
            </div>
          </div>
        );
        
      case 'button':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input 
                value={(component as ButtonComponent).text}
                onChange={(e) => updateComponent(component.id, { text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input 
                value={(component as ButtonComponent).url}
                onChange={(e) => updateComponent(component.id, { url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Button Style</Label>
              <select 
                value={(component as ButtonComponent).variant}
                onChange={(e) => updateComponent(component.id, { variant: e.target.value as 'default'|'outline'|'destructive' })}
                className="w-full p-2 border rounded"
              >
                <option value="default">Primary</option>
                <option value="outline">Outline</option>
                <option value="destructive">Destructive</option>
              </select>
            </div>
          </div>
        );
        
      case 'container':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Layout Direction</Label>
              <select 
                value={(component as ContainerComponent).layout}
                onChange={(e) => updateComponent(component.id, { layout: e.target.value as 'vertical'|'horizontal' })}
                className="w-full p-2 border rounded"
              >
                <option value="vertical">Vertical (Stack)</option>
                <option value="horizontal">Horizontal (Row)</option>
              </select>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Container Children</Label>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addComponent('heading', component.id)}
                  >
                    <Type className="h-4 w-4 mr-1" />
                    Add Heading
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addComponent('text', component.id)}
                  >
                    <Type className="h-4 w-4 mr-1" />
                    Add Text
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addComponent('image', component.id)}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Add Image
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 border rounded p-3 bg-slate-50 dark:bg-slate-900">
                {(component as ContainerComponent).children.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    This container is empty. Add components using the buttons above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(component as ContainerComponent).children.map((child) => (
                      <ComponentTreeItem key={child.id} component={child} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown component type</div>;
    }
  };

  // Component display
  const ComponentPreview = ({ component }: { component: PageComponent }) => {
    if (!component.visible) {
      return null;
    }
    
    switch (component.type) {
      case 'heading':
        const HeadingTag = `h${(component as HeadingComponent).level}` as keyof JSX.IntrinsicElements;
        return <HeadingTag className="font-bold">{(component as HeadingComponent).content}</HeadingTag>;
        
      case 'text':
        return <p className="text-gray-700 dark:text-gray-300">{(component as TextComponent).content}</p>;
        
      case 'image':
        return <img src={(component as ImageComponent).src} alt={(component as ImageComponent).alt} className="max-w-full h-auto" />;
        
      case 'button':
        const btnComponent = component as ButtonComponent;
        const btnClass = btnComponent.variant === 'outline' 
          ? "py-2 px-4 border border-primary rounded"
          : btnComponent.variant === 'destructive'
            ? "py-2 px-4 bg-red-600 text-white rounded"
            : "py-2 px-4 bg-primary text-white rounded";
        
        return <button className={btnClass}>{btnComponent.text}</button>;
        
      case 'container':
        const containerClass = (component as ContainerComponent).layout === 'horizontal' 
          ? "flex flex-col md:flex-row gap-4" 
          : "flex flex-col gap-4";
        
        return (
          <div className={containerClass}>
            {(component as ContainerComponent).children.map(child => (
              <ComponentPreview key={child.id} component={child} />
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Component tree item (for editing)
  const ComponentTreeItem = ({ component }: { component: PageComponent }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const handleToggleExpand = () => {
      setIsExpanded(!isExpanded);
    };
    
    const typeIcon = () => {
      switch (component.type) {
        case 'heading': return <Type className="h-4 w-4" />;
        case 'text': return <Type className="h-4 w-4" />;
        case 'image': return <Image className="h-4 w-4" />;
        case 'button': return <Button className="h-4 w-4" />;
        case 'container': return <Layout className="h-4 w-4" />;
        default: return null;
      }
    };
    
    return (
      <div className="border rounded">
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800">
          <div className="flex items-center space-x-2">
            {typeIcon()}
            <span className="font-medium">
              {component.type === 'heading' ? `Heading (H${(component as HeadingComponent).level})` : 
               component.type === 'text' ? 'Text' :
               component.type === 'image' ? 'Image' :
               component.type === 'button' ? 'Button' :
               component.type === 'container' ? `Container (${(component as ContainerComponent).layout})` :
               component.type}
            </span>
            {!component.visible && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded dark:bg-yellow-800 dark:text-yellow-100">
                Hidden
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={() => toggleComponentVisibility(component.id)}>
              {component.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => moveComponent(component.id, 'up')}>
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => moveComponent(component.id, 'down')}>
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => removeComponent(component.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            {component.type === 'container' && (
              <Button size="sm" variant="ghost" onClick={handleToggleExpand}>
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-3">
            <ComponentEditor component={component} />
          </div>
        )}
      </div>
    );
  };

  // Check if user is admin
  useEffect(() => {
    if (user && user.roleId !== 1) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the page builder.",
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
            <h1 className="text-3xl font-bold tracking-tight">Page Builder</h1>
            <p className="text-muted-foreground">
              Create and customize pages for your application
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            <Button 
              onClick={savePage}
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
                  Save Page
                </>
              )}
            </Button>
          </div>
        </div>

        {isPreviewMode ? (
          <Card>
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
              <CardDescription>
                Preview of the page as it will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 py-4">
                {page.components.map(component => (
                  <ComponentPreview key={component.id} component={component} />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Page Details</CardTitle>
                  <CardDescription>
                    Basic information about the page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-title">Page Title</Label>
                      <Input 
                        id="page-title" 
                        value={page.title}
                        onChange={(e) => updatePageMeta('title', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="page-slug">URL Slug</Label>
                      <Input 
                        id="page-slug" 
                        value={page.slug}
                        onChange={(e) => updatePageMeta('slug', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The page will be accessible at: /pages/{page.slug}
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <div className="text-sm font-medium mb-2">Add Components</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addComponent('heading')}
                        >
                          <Type className="h-4 w-4 mr-1" />
                          Heading
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addComponent('text')}
                        >
                          <Type className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addComponent('image')}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Image
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addComponent('button')}
                        >
                          <Button className="h-4 w-4 mr-1" />
                          Button
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addComponent('container')}
                          className="col-span-2"
                        >
                          <Layout className="h-4 w-4 mr-1" />
                          Container
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Page Components</CardTitle>
                  <CardDescription>
                    Drag and arrange your page components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {page.components.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium">No Components</h3>
                      <p className="text-muted-foreground mt-2">
                        Add some components to get started with your page.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => addComponent('heading')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Component
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {page.components.map(component => (
                        <ComponentTreeItem key={component.id} component={component} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}