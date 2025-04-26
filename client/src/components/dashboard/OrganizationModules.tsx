import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building, 
  Save, 
  PlusCircle, 
  UserCog, 
  Briefcase, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define the Organization interface based on the schema.ts definitions
interface Organization {
  id: number;
  name: string;
  code: string;
  active: boolean;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  enabledModules: {
    sales: boolean;
    dispatch: boolean;
    hr: boolean;
    finance: boolean;
    marketing: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Form schema for creating/editing an organization
const orgSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  code: z.string().min(2, { message: "Code must be at least 2 characters" }),
  active: z.boolean().default(true),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  logoUrl: z.string().optional(),
});

// Form schema for updating modules
const modulesSchema = z.object({
  sales: z.boolean().default(true),
  dispatch: z.boolean().default(true),
  hr: z.boolean().default(true),
  finance: z.boolean().default(true),
  marketing: z.boolean().default(true),
});

type OrganizationModulesProps = {
  className?: string;
}

export function OrganizationModules({ className }: OrganizationModulesProps) {
  const [activeTab, setActiveTab] = useState('organizations');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizations, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json() as Promise<Organization[]>;
    },
  });

  // Form for editing organization details
  const orgForm = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: editingOrg?.name || '',
      code: editingOrg?.code || '',
      active: editingOrg?.active ?? true,
      address: editingOrg?.address || '',
      contactName: editingOrg?.contactName || '',
      contactEmail: editingOrg?.contactEmail || '',
      contactPhone: editingOrg?.contactPhone || '',
      logoUrl: editingOrg?.logoUrl || '',
    },
  });

  // Form for editing modules
  const modulesForm = useForm<z.infer<typeof modulesSchema>>({
    resolver: zodResolver(modulesSchema),
    defaultValues: {
      sales: editingOrg?.enabledModules?.sales ?? true,
      dispatch: editingOrg?.enabledModules?.dispatch ?? true,
      hr: editingOrg?.enabledModules?.hr ?? true,
      finance: editingOrg?.enabledModules?.finance ?? true,
      marketing: editingOrg?.enabledModules?.marketing ?? true,
    },
  });

  // Update form values when editing organization changes
  React.useEffect(() => {
    if (editingOrg) {
      orgForm.reset({
        name: editingOrg.name,
        code: editingOrg.code,
        active: editingOrg.active,
        address: editingOrg.address || '',
        contactName: editingOrg.contactName || '',
        contactEmail: editingOrg.contactEmail || '',
        contactPhone: editingOrg.contactPhone || '',
        logoUrl: editingOrg.logoUrl || '',
      });
      
      modulesForm.reset({
        sales: editingOrg.enabledModules?.sales ?? true,
        dispatch: editingOrg.enabledModules?.dispatch ?? true,
        hr: editingOrg.enabledModules?.hr ?? true,
        finance: editingOrg.enabledModules?.finance ?? true,
        marketing: editingOrg.enabledModules?.marketing ?? true,
      });
    }
  }, [editingOrg, orgForm, modulesForm]);

  // Handler for selecting an organization to edit
  const handleSelectOrg = (org: Organization) => {
    setEditingOrg(org);
    setActiveTab('modules');
  };

  // Handler for creating a new organization
  const handleCreateOrg = () => {
    setEditingOrg(null);
    orgForm.reset({
      name: '',
      code: '',
      active: true,
      address: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      logoUrl: '',
    });
    setActiveTab('new');
  };

  // Handler for saving organization details
  const onSaveOrg = async (data: z.infer<typeof orgSchema>) => {
    try {
      let response;
      
      if (editingOrg) {
        // Update existing organization
        response = await apiRequest('PUT', `/api/organizations/${editingOrg.id}`, data);
      } else {
        // Create new organization
        response = await apiRequest('POST', '/api/organizations', data);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save organization');
      }
      
      const savedOrg = await response.json();
      
      toast({
        title: `Organization ${editingOrg ? 'updated' : 'created'} successfully`,
        description: `${savedOrg.name} has been ${editingOrg ? 'updated' : 'created'}.`,
      });
      
      // Invalidate the organizations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      
      // If creating a new org, switch to modules tab and set the editing org
      if (!editingOrg) {
        setEditingOrg(savedOrg);
        setActiveTab('modules');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save organization',
        variant: 'destructive',
      });
    }
  };

  // Handler for saving module settings
  const onSaveModules = async (data: z.infer<typeof modulesSchema>) => {
    if (!editingOrg) return;
    
    try {
      const response = await apiRequest('PUT', `/api/organizations/${editingOrg.id}/modules`, {
        enabledModules: data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update modules');
      }
      
      const updatedOrg = await response.json();
      
      toast({
        title: 'Modules updated successfully',
        description: `Module settings for ${updatedOrg.name} have been updated.`,
      });
      
      // Update the editing org with the new data
      setEditingOrg(updatedOrg);
      
      // Invalidate the organizations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update modules',
        variant: 'destructive',
      });
    }
  };

  // Get the module icon based on the module name
  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'sales':
        return <Briefcase className="h-5 w-5" />;
      case 'dispatch':
        return <Truck className="h-5 w-5" />;
      case 'hr':
        return <UserCog className="h-5 w-5" />;
      case 'finance':
        return <DollarSign className="h-5 w-5" />;
      case 'marketing':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  // Get the module description based on the module name
  const getModuleDescription = (module: string) => {
    switch (module) {
      case 'sales':
        return 'Customer relationship management and sales tracking features';
      case 'dispatch':
        return 'Load management, carrier relations, and dispatch operations';
      case 'hr':
        return 'Employee management, hiring, and HR documentation';
      case 'finance':
        return 'Financial reporting, invoicing, and accounting features';
      case 'marketing':
        return 'Marketing campaigns, lead generation, and analytics';
      default:
        return '';
    }
  };

  return (
    <Card className={`shadow-md hover:shadow-lg transition-all ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Organization & Module Management</CardTitle>
        <CardDescription>Configure organizations and enable/disable modules for each organization</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="organizations" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="modules" disabled={!editingOrg}>Module Settings</TabsTrigger>
            <TabsTrigger value="new">New Organization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organizations" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-700">
                <p>Error loading organizations: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-end">
                  <Button onClick={handleCreateOrg}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Organization
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {organizations && organizations.map(org => (
                    <div
                      key={org.id}
                      className="p-3 border rounded-md flex items-center justify-between hover:bg-accent/20 cursor-pointer"
                      onClick={() => handleSelectOrg(org)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">Code: {org.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${org.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {org.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {organizations && organizations.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No organizations found. Click "New Organization" to create one.
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="modules" className="mt-0">
            {!editingOrg ? (
              <div className="p-4 text-center text-muted-foreground">
                Please select an organization first.
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 border rounded-md bg-accent/10">
                  <h3 className="font-medium text-lg">{editingOrg.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable modules for this organization. Changes will affect all users in this organization.
                  </p>
                </div>
                
                <Form {...modulesForm}>
                  <form onSubmit={modulesForm.handleSubmit(onSaveModules)} className="space-y-4">
                    <div className="space-y-4">
                      {Object.keys(editingOrg.enabledModules).map((module) => (
                        <div 
                          key={module}
                          className="p-4 border rounded-md flex items-start justify-between hover:bg-accent/10"
                        >
                          <div className="flex gap-4">
                            <div className="p-2 bg-primary/10 rounded-md mt-1">
                              {getModuleIcon(module)}
                            </div>
                            <div>
                              <h4 className="font-medium capitalize">{module}</h4>
                              <p className="text-sm text-muted-foreground">{getModuleDescription(module)}</p>
                            </div>
                          </div>
                          
                          <FormField
                            control={modulesForm.control}
                            name={module as any}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">
                                  {field.value ? 'Enabled' : 'Disabled'}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Module Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="new" className="mt-0">
            <Form {...orgForm}>
              <form onSubmit={orgForm.handleSubmit(onSaveOrg)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={orgForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="MetaSys Solutions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Code</FormLabel>
                        <FormControl>
                          <Input placeholder="METASYS" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unique identifier used in system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Whether this organization is active in the system
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business St." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="contact@metasys.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={orgForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to the organization's logo image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('organizations')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Organization
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}