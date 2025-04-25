import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Role, Organization, insertUserSchema } from "@shared/schema";
import { useUserManagement } from "@/hooks/use-user-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Extended schema with validation
const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
  // Override the optional fields to make sure they're properly typed
  orgId: z.number().nullable(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Omit password field when editing a user
type EditUserFormValues = Omit<UserFormValues, "password" | "confirmPassword">;

type UserFormProps = {
  user?: User;
  roles: Role[];
  organizations: Organization[];
  onClose: () => void;
};

export function UserForm({ user, roles, organizations, onClose }: UserFormProps) {
  const isEditMode = !!user;
  const { createUserMutation, updateUserMutation } = useUserManagement();
  const [showPassword, setShowPassword] = useState(!isEditMode);

  // Set up the form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? userFormSchema.partial() : userFormSchema),
    defaultValues: user
      ? {
          ...user,
          password: "",
          confirmPassword: "",
        }
      : {
          username: "",
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          roleId: roles[0]?.id || 0,
          orgId: organizations[0]?.id || null,
          active: true,
        },
  });

  async function onSubmit(data: UserFormValues) {
    if (isEditMode) {
      const { password, confirmPassword, ...updateData } = data;
      
      // Only include password in the update if the user changed it
      const finalUpdateData = password 
        ? { ...updateData, password } 
        : updateData;
      
      await updateUserMutation.mutateAsync({
        id: user.id,
        userData: finalUpdateData,
      });
    } else {
      await createUserMutation.mutateAsync(data);
    }
    
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Password fields - conditionally show for new users or when editing */}
        {(showPassword || !isEditMode) && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? "New Password" : "Password"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isEditMode && !showPassword && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPassword(true)}
            className="w-full"
          >
            Change Password
          </Button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="orgId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEditMode && (
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">User Status</FormLabel>
                  <FormDescription>
                    {field.value ? "This user is active and can log in" : "This user cannot log in"}
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
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
            className="bg-brandTeal hover:bg-brandTeal/90"
          >
            {(createUserMutation.isPending || updateUserMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}