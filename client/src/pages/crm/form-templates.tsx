import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, FileEdit, Trash2, FilePlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

// Form Schema for creating/editing form templates
const formTemplateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  fields: z.array(z.object({
    label: z.string().min(1, 'Field label is required'),
    type: z.enum(['text', 'textarea', 'number', 'checkbox', 'date', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).min(1, 'At least one field is required'),
  isActive: z.boolean().default(true),
});

type FormTemplateFormValues = z.infer<typeof formTemplateSchema>;

export default function FormTemplatesPage() {
  const { toast } = useToast();
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Fetch form templates
  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['/api/crm/form-templates'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create form template mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormTemplateFormValues) => {
      const response = await apiRequest('POST', '/api/crm/form-templates', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Form template created successfully',
      });
      setIsNewFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/crm/form-templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create form template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update form template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormTemplateFormValues }) => {
      const response = await apiRequest('PUT', `/api/crm/form-templates/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Form template updated successfully',
      });
      setIsEditFormOpen(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['/api/crm/form-templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update form template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete form template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/crm/form-templates/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Form template deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/form-templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete form template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Setup form for creating new templates
  const newForm = useForm<FormTemplateFormValues>({
    resolver: zodResolver(formTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [{ label: '', type: 'text', required: false }],
      isActive: true,
    },
  });

  // Setup form for editing templates
  const editForm = useForm<FormTemplateFormValues>({
    resolver: zodResolver(formTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [{ label: '', type: 'text', required: false }],
      isActive: true,
    },
  });

  // Handle create form submission
  const onCreateSubmit = (data: FormTemplateFormValues) => {
    createMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: FormTemplateFormValues) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  // Setup editing a template
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    editForm.reset({
      name: template.name,
      description: template.description || '',
      fields: template.fields || [{ label: '', type: 'text', required: false }],
      isActive: template.isActive,
    });
    setIsEditFormOpen(true);
  };

  // Add a new field to the form
  const addField = (form: any) => {
    const currentFields = form.getValues('fields') || [];
    form.setValue('fields', [
      ...currentFields,
      { label: '', type: 'text', required: false },
    ]);
  };

  // Remove a field from the form
  const removeField = (form: any, index: number) => {
    const currentFields = form.getValues('fields');
    if (currentFields.length > 1) {
      form.setValue(
        'fields',
        currentFields.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: 'Warning',
        description: 'Form must have at least one field',
        variant: 'destructive',
      });
    }
  };

  // Delete a template after confirmation
  const handleDeleteTemplate = (id: number) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <PageHeader title="Form Templates" description="Create and manage form templates for lead qualification" />
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container py-6">
        <PageHeader title="Form Templates" description="Create and manage form templates for lead qualification" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load form templates. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Form Templates" description="Create and manage form templates for lead qualification" />
        <Dialog open={isNewFormOpen} onOpenChange={setIsNewFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
              <Plus className="mr-2 h-4 w-4" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Form Template</DialogTitle>
              <DialogDescription>
                Create a new form template for collecting information from leads.
              </DialogDescription>
            </DialogHeader>
            <Form {...newForm}>
              <form onSubmit={newForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={newForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description for this template"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Active templates can be used for new form submissions
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Form Fields</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addField(newForm)}
                      className="text-[#025E73]"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Field
                    </Button>
                  </div>
                  {newForm.watch('fields').map((field, index) => (
                    <div key={index} className="p-4 border rounded-md mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeField(newForm, index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={newForm.control}
                          name={`fields.${index}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Label*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter field label" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newForm.control}
                          name={`fields.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Type*</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                >
                                  <option value="text">Text</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="number">Number</option>
                                  <option value="checkbox">Checkbox</option>
                                  <option value="date">Date</option>
                                  <option value="select">Select</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-4">
                        <FormField
                          control={newForm.control}
                          name={`fields.${index}.required`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Required Field</FormLabel>
                                <FormDescription>
                                  This field must be filled out to submit the form
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#025E73] hover:bg-[#025E73]/90"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Form Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form Template</DialogTitle>
            <DialogDescription>
              Update the form template details and fields.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this template"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Active templates can be used for new form submissions
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Form Fields</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addField(editForm)}
                    className="text-[#025E73]"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Field
                  </Button>
                </div>
                {editForm.watch('fields').map((field, index) => (
                  <div key={index} className="p-4 border rounded-md mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Field {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeField(editForm, index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={editForm.control}
                        name={`fields.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Label*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter field label" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name={`fields.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Type*</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="text">Text</option>
                                <option value="textarea">Textarea</option>
                                <option value="number">Number</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="date">Date</option>
                                <option value="select">Select</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4">
                      <FormField
                        control={editForm.control}
                        name={`fields.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Required Field</FormLabel>
                              <FormDescription>
                                This field must be filled out to submit the form
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditFormOpen(false);
                    setEditingTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#025E73] hover:bg-[#025E73]/90"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Template'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Templates Grid */}
      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        {templates && templates.length > 0 ? (
          templates.map((template: any) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.isActive ? "default" : "outline"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Fields: {template.fields?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  <FileEdit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-100">
              <FilePlus className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No form templates yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first form template to start qualifying leads
            </p>
            <Button
              onClick={() => setIsNewFormOpen(true)}
              className="mt-4 bg-[#025E73] hover:bg-[#025E73]/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}