import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AdminEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  module: string;
  fields: FieldConfig[];
  onSubmit: (data: any) => Promise<void>;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select' | 'date' | 'email';
  options?: { label: string; value: string | number | boolean }[];
  readOnly?: boolean;
  disabled?: boolean;
  description?: string;
  required?: boolean;
  pattern?: {
    value: RegExp;
    message: string;
  };
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * A dynamic form modal for editing any entity in the system
 * Used by admin global edit controls
 */
export function AdminEditModal({
  open,
  onOpenChange,
  item,
  module,
  fields,
  onSubmit
}: AdminEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically generate schema based on fields configuration
  const generateSchema = () => {
    const schemaObj: Record<string, any> = {};
    
    fields.forEach(field => {
      let schema;
      
      switch (field.type) {
        case 'text':
        case 'textarea':
          schema = z.string();
          if (field.minLength) schema = schema.min(field.minLength, `${field.label} must be at least ${field.minLength} characters`);
          if (field.maxLength) schema = schema.max(field.maxLength, `${field.label} must be at most ${field.maxLength} characters`);
          if (field.pattern) schema = schema.regex(field.pattern.value, field.pattern.message);
          break;
        case 'email':
          schema = z.string().email(`${field.label} must be a valid email address`);
          break;
        case 'number':
          schema = z.coerce.number();
          if (field.min !== undefined) schema = schema.min(field.min, `${field.label} must be at least ${field.min}`);
          if (field.max !== undefined) schema = schema.max(field.max, `${field.label} must be at most ${field.max}`);
          break;
        case 'boolean':
          schema = z.boolean();
          break;
        case 'date':
          schema = z.string().transform((val) => new Date(val));
          break;
        case 'select':
          schema = z.string();
          break;
        default:
          schema = z.string();
      }
      
      // Make optional if not required
      if (!field.required) {
        schema = schema.optional();
      }
      
      schemaObj[field.name] = schema;
    });
    
    return z.object(schemaObj);
  };
  
  const schema = generateSchema();
  
  // Initialize the form with values from the item
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((values, field) => {
      values[field.name] = item[field.name] !== undefined ? item[field.name] : '';
      return values;
    }, {} as Record<string, any>),
  });
  
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: `${module} updated successfully`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update ${module}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
            {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
            <FormControl>
              {renderFieldInput(field, formField)}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // Render appropriate input component based on field type
  const renderFieldInput = (fieldConfig: FieldConfig, formField: any) => {
    switch (fieldConfig.type) {
      case 'textarea':
        return (
          <Textarea
            {...formField}
            disabled={fieldConfig.disabled || isSubmitting}
            readOnly={fieldConfig.readOnly}
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={formField.value}
            onCheckedChange={formField.onChange}
            disabled={fieldConfig.disabled || isSubmitting}
          />
        );
      case 'select':
        return (
          <Select
            value={String(formField.value)}
            onValueChange={formField.onChange}
            disabled={fieldConfig.disabled || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
        return (
          <Input
            {...formField}
            type="number"
            disabled={fieldConfig.disabled || isSubmitting}
            readOnly={fieldConfig.readOnly}
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
            min={fieldConfig.min}
            max={fieldConfig.max}
          />
        );
      case 'date':
        return (
          <Input
            {...formField}
            type="date"
            disabled={fieldConfig.disabled || isSubmitting}
            readOnly={fieldConfig.readOnly}
            value={formField.value ? new Date(formField.value).toISOString().split('T')[0] : ''}
          />
        );
      case 'email':
        return (
          <Input
            {...formField}
            type="email"
            disabled={fieldConfig.disabled || isSubmitting}
            readOnly={fieldConfig.readOnly}
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        );
      default:
        return (
          <Input
            {...formField}
            disabled={fieldConfig.disabled || isSubmitting}
            readOnly={fieldConfig.readOnly}
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {module}</DialogTitle>
          <DialogDescription>
            Make changes to the {module.toLowerCase()} data below. System Admins can edit all fields.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              {/* Read-only ID display */}
              {item.id && (
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-medium">ID</p>
                  <p className="text-sm text-muted-foreground">{item.id}</p>
                </div>
              )}
              
              {/* Grid layout for fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(renderField)}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}