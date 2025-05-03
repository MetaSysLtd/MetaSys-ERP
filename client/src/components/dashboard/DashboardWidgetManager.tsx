import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/use-auth';

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
  const [availableList, setAvailableList] = useState<Array<typeof availableWidgets[0]>>([]);

  // Query to get user's dashboard widgets
  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/widgets'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/dashboard/widgets');
      if (!res.ok) {
        throw new Error('Failed to load dashboard widgets');
      }
      return res.json();
    },
  });

  // Update available widgets based on what the user already has
  useEffect(() => {
    if (widgets.length) {
      const userWidgetKeys = widgets.map((w: Widget) => w.widgetKey);
      setAvailableList(
        availableWidgets.filter(w => !userWidgetKeys.includes(w.key))
      );
    } else {
      setAvailableList([...availableWidgets]);
    }
  }, [widgets]);

  // Add widget mutation
  const addWidgetMutation = useMutation({
    mutationFn: async (newWidget: Omit<Widget, 'id'>) => {
      const res = await apiRequest('POST', '/api/dashboard/widgets', newWidget);
      if (!res.ok) {
        throw new Error('Failed to add widget');
      }
      return res.json();
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
      const res = await apiRequest('PATCH', `/api/dashboard/widgets/${widget.id}`, widget);
      if (!res.ok) {
        throw new Error('Failed to update widget');
      }
      return res.json();
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
      const res = await apiRequest('DELETE', `/api/dashboard/widgets/${widgetId}`);
      if (!res.ok) {
        throw new Error('Failed to delete widget');
      }
      return res.json();
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
      const res = await apiRequest('POST', '/api/dashboard/widgets/reorder', { widgets: updatedWidgets });
      if (!res.ok) {
        throw new Error('Failed to reorder widgets');
      }
      return res.json();
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
    
    const items = Array.from(widgets as Widget[]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions
    const updatedItems = items.map((item: Widget, index: number) => ({
      ...item,
      position: index,
    }));
    
    reorderWidgetsMutation.mutate(updatedItems);
  };

  // Handle adding a new widget
  const handleAddWidget = (widgetKey: string) => {
    const widgetDef = availableWidgets.find(w => w.key === widgetKey);
    if (!widgetDef) return;
    
    addWidgetMutation.mutate({
      widgetType: widgetDef.type,
      widgetKey: widgetDef.key,
      title: widgetDef.title,
      position: widgets.length,
      width: 'half',
      height: 'normal',
      isVisible: true,
      config: {},
      userId: extendedUser?.id || 0,
      orgId: extendedUser?.orgId || 1,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>Customize Dashboard</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
            <DialogDescription>
              Add, remove, or reorder widgets on your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Add new widget section */}
            <div className="flex items-center gap-2">
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
                variant="outline"
                size="sm"
                disabled={availableList.length === 0}
                onClick={() => {
                  if (availableList.length > 0) {
                    handleAddWidget(availableList[0].key);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            
            {/* Widget list with drag and drop */}
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-3">Current Widgets</h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
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
                              className="flex items-center justify-between p-2 bg-card border rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className={widget.isVisible ? '' : 'text-muted-foreground line-through'}>
                                  {widget.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={widget.isVisible}
                                  onCheckedChange={() => handleToggleVisibility(widget)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditWidget(widget)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteWidgetMutation.mutate(widget.id)}
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
              
              {widgets.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No widgets added. Add your first widget to customize your dashboard.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Widget Dialog */}
      {editWidget && (
        <Dialog
          open={!!editWidget}
          onOpenChange={(open) => !open && setEditWidget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Widget: {editWidget.title}</DialogTitle>
              <DialogDescription>
                Customize how this widget appears on your dashboard.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Widget Title</Label>
                <Input
                  id="title"
                  value={editWidget.title}
                  onChange={(e) => setEditWidget({ ...editWidget, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="width">Widget Width</Label>
                <Select
                  value={editWidget.width}
                  onValueChange={(value: 'full' | 'half' | 'third') => 
                    setEditWidget({ ...editWidget, width: value })
                  }
                >
                  <SelectTrigger id="width">
                    <SelectValue placeholder="Select width" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="half">Half Width</SelectItem>
                    <SelectItem value="third">One Third</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Widget Height</Label>
                <Select
                  value={editWidget.height}
                  onValueChange={(value: 'small' | 'normal' | 'large') => 
                    setEditWidget({ ...editWidget, height: value })
                  }
                >
                  <SelectTrigger id="height">
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="visible"
                  checked={editWidget.isVisible}
                  onCheckedChange={(checked) => 
                    setEditWidget({ ...editWidget, isVisible: checked })
                  }
                />
                <Label htmlFor="visible">Show widget on dashboard</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditWidget(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateWidgetMutation.mutate(editWidget)}
                disabled={updateWidgetMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}