import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayoutGrid, Plus, Settings, X, GripVertical, Edit } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';

// Extended User interface with orgId
interface ExtendedUser {
  id: number;
  orgId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Widget {
  id: number;
  widgetType: string;
  widgetKey: string;
  title: string;
  position: number;
  width: 'full' | 'half' | 'third';
  height: 'small' | 'normal' | 'large';
  isVisible: boolean;
  config: Record<string, any>;
  userId: number;
  orgId: number;
}

// Available widget definitions
const availableWidgets = [
  { key: 'sales_commission', title: 'Sales Commission', type: 'sales' },
  { key: 'dispatch_commission', title: 'Dispatch Commission', type: 'dispatch' },
  { key: 'sales_performance', title: 'Sales Performance', type: 'sales' },
  { key: 'dispatch_performance', title: 'Dispatch Performance', type: 'dispatch' },
  { key: 'team_metrics', title: 'Team Metrics', type: 'team' },
  { key: 'onboarding_ratio', title: 'Client Onboarding', type: 'client' },
  { key: 'revenue_overview', title: 'Revenue Overview', type: 'finance' },
  { key: 'activity_feed', title: 'Activity Feed', type: 'system' },
  { key: 'recent_leads', title: 'Recent Leads', type: 'sales' },
  { key: 'dispatch_report', title: 'Dispatch Report', type: 'dispatch' },
  { key: 'kpi_section', title: 'KPI Metrics', type: 'system' },
];

export function DashboardWidgetManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const extendedUser = user as unknown as ExtendedUser;
  const [open, setOpen] = useState(false);
  const [editWidget, setEditWidget] = useState<Widget | null>(null);
  // Query to get user's dashboard widgets
  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/widgets'],
    staleTime: 60000, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Use memoized list of available widgets instead of state + useEffect
  const availableList = useMemo(() => {
    // Guard against non-array data or undefined
    if (!widgets || !Array.isArray(widgets)) {
      return availableWidgets;
    }
    
    if (widgets.length === 0) {
      return availableWidgets;
    }
    
    try {
      const userWidgetKeys = widgets.map((w: Widget) => w.widgetKey);
      return availableWidgets.filter(w => !userWidgetKeys.includes(w.key));
    } catch (error) {
      console.error('Error processing widget data:', error);
      return availableWidgets;
    }
  }, [widgets]);

  // Add widget mutation
  const addWidgetMutation = useMutation({
    mutationFn: async (newWidget: Omit<Widget, 'id'>) => {
      try {
        const res = await apiRequest('POST', '/api/dashboard/widgets', newWidget);
        
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to add widget: ${errorData}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Widget addition error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: 'Widget added',
        description: 'Your dashboard has been updated',
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update widget mutation
  const updateWidgetMutation = useMutation({
    mutationFn: async (widget: Widget) => {
      try {
        const res = await apiRequest('PATCH', `/api/dashboard/widgets/${widget.id}`, widget);
        
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to update widget: ${errorData}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Widget update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: 'Widget updated',
        description: 'Your dashboard has been updated',
      });
      setEditWidget(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete widget mutation
  const deleteWidgetMutation = useMutation({
    mutationFn: async (widgetId: number) => {
      try {
        const res = await apiRequest('DELETE', `/api/dashboard/widgets/${widgetId}`);
        
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to delete widget: ${errorData}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Widget deletion error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: 'Widget removed',
        description: 'Your dashboard has been updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove widget',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reorder widgets mutation
  const reorderWidgetsMutation = useMutation({
    mutationFn: async (updatedWidgets: Widget[]) => {
      try {
        const res = await apiRequest('POST', '/api/dashboard/widgets/reorder', { widgets: updatedWidgets });
        
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to reorder widgets: ${errorData}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Widget reordering error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: 'Dashboard updated',
        description: 'Widget order has been saved',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update dashboard',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle widget visibility toggle
  const handleToggleVisibility = (widget: Widget) => {
    updateWidgetMutation.mutate({
      ...widget,
      isVisible: !widget.isVisible,
    });
  };

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    try {
      // Ensure widgets is an array and has items before proceeding
      if (!Array.isArray(widgets) || widgets.length === 0) {
        console.error('Cannot reorder: widgets is not a valid array or is empty');
        toast({
          title: 'Cannot reorder widgets',
          description: 'Widget data is not available. Please refresh the page.',
          variant: 'destructive',
        });
        return;
      }
      
      const items = Array.from(widgets as Widget[]);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      // Update positions
      const updatedItems = items.map((item: Widget, index: number) => ({
        ...item,
        position: index,
      }));
      
      reorderWidgetsMutation.mutate(updatedItems);
    } catch (error) {
      console.error('Error in drag and drop operation:', error);
      toast({
        title: 'Error reordering widgets',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle adding a new widget
  const handleAddWidget = (widgetKey: string) => {
    try {
      // Validate widget key exists in available widgets
      const widgetDef = availableWidgets.find(w => w.key === widgetKey);
      if (!widgetDef) {
        console.error('Widget definition not found for key:', widgetKey);
        toast({
          title: 'Widget not found',
          description: 'The selected widget type is not available.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate user information is available
      if (!extendedUser?.id) {
        console.error('Cannot add widget: User ID not found');
        toast({
          title: 'Authentication error',
          description: 'User information is not available. Please refresh the page or log in again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Add the widget
      addWidgetMutation.mutate({
        widgetType: widgetDef.type,
        widgetKey: widgetDef.key,
        title: widgetDef.title,
        position: Array.isArray(widgets) ? widgets.length : 0,
        width: 'half',
        height: 'normal',
        isVisible: true,
        config: {},
        userId: extendedUser.id,
        orgId: extendedUser.orgId || 1,
      });
    } catch (error) {
      console.error('Error adding widget:', error);
      toast({
        title: 'Error adding widget',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 whitespace-nowrap md:flex hidden border-[#025E73] text-[#025E73] hover:bg-[#025E73]/10"
            aria-label="Customize Dashboard"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Customize Dashboard</span>
          </Button>
        </DialogTrigger>
        {/* Mobile-friendly icon-only button */}
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="md:hidden flex border-[#025E73] text-[#025E73] hover:bg-[#025E73]/10"
            aria-label="Customize Dashboard"
            title="Customize Dashboard"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
            <DialogDescription>
              Add, remove, or reorder widgets on your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Add new widget section - responsive for mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select onValueChange={handleAddWidget}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select widget to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableList.map((widget) => (
                    <SelectItem key={widget.key} value={widget.key}>
                      {widget.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="sm"
                className="sm:w-auto w-full bg-[#025E73] hover:bg-[#025E73]/90 text-white"
                disabled={availableList.length === 0}
                onClick={() => {
                  if (availableList.length > 0) {
                    handleAddWidget(availableList[0].key);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Widget
              </Button>
            </div>
            
            {/* Widget list with drag and drop - improved for mobile scrolling */}
            <div className="border rounded-md p-4 overflow-hidden">
              <h3 className="font-medium mb-3">Current Widgets</h3>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="h-8 w-8 border-4 border-[#025E73] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Loading your dashboard widgets...</p>
                </div>
              ) : Array.isArray(widgets) && widgets.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="widgets">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 max-h-[40vh] overflow-y-auto pr-1"
                      >
                        {widgets.map((widget: Widget, index: number) => (
                          <Draggable
                            key={widget.id.toString()}
                            draggableId={widget.id.toString()}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2 bg-card border rounded-md"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div {...provided.dragHandleProps} className="cursor-move flex-shrink-0">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className={`${widget.isVisible ? '' : 'text-muted-foreground line-through'} truncate`}>
                                    {widget.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                                  <div className="flex items-center">
                                    <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">Visible</span>
                                    <Switch
                                      checked={widget.isVisible}
                                      onCheckedChange={() => handleToggleVisibility(widget)}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditWidget(widget)}
                                    aria-label="Edit Widget"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteWidgetMutation.mutate(widget.id)}
                                    aria-label="Delete Widget"
                                  >
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No widgets added. Add your first widget to customize your dashboard.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="secondary" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Widget Dialog - Responsive Design */}
      {editWidget && (
        <Dialog
          open={!!editWidget}
          onOpenChange={(open) => !open && setEditWidget(null)}
        >
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Widget: {editWidget.title}</DialogTitle>
              <DialogDescription>
                Customize how this widget appears on your dashboard.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Widget Title</Label>
                <Input
                  id="title"
                  value={editWidget.title}
                  onChange={(e) => setEditWidget({ ...editWidget, title: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-sm font-medium">Widget Width</Label>
                  <Select
                    value={editWidget.width}
                    onValueChange={(value: 'full' | 'half' | 'third') => 
                      setEditWidget({ ...editWidget, width: value })
                    }
                  >
                    <SelectTrigger id="width" className="w-full">
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Width</SelectItem>
                      <SelectItem value="half">Half Width</SelectItem>
                      <SelectItem value="third">One Third</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Determines how much horizontal space the widget occupies
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm font-medium">Widget Height</Label>
                  <Select
                    value={editWidget.height}
                    onValueChange={(value: 'small' | 'normal' | 'large') => 
                      setEditWidget({ ...editWidget, height: value })
                    }
                  >
                    <SelectTrigger id="height" className="w-full">
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Determines the vertical size of the widget
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-md">
                <Switch
                  id="visible"
                  checked={editWidget.isVisible}
                  onCheckedChange={(checked) => 
                    setEditWidget({ ...editWidget, isVisible: checked })
                  }
                />
                <div>
                  <Label htmlFor="visible" className="text-sm font-medium">Show widget on dashboard</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle to hide or show this widget without removing it
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setEditWidget(null)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateWidgetMutation.mutate(editWidget)}
                disabled={updateWidgetMutation.isPending}
                className="w-full sm:w-auto order-1 sm:order-2 bg-[#025E73] hover:bg-[#025E73]/90 text-white"
              >
                {updateWidgetMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> 
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}