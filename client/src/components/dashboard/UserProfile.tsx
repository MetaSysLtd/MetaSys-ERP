import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Building, Calendar, Edit, Lock, Mail, Phone, User, UserCog, 
  MapPin, Briefcase, Shield, ArrowUpRight
} from 'lucide-react';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// User profile data type
export type UserProfileData = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  role: string;
  department: string;
  level: number;
  permissions: string[];
  active: boolean;
  profileImageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bio?: string;
  joinDate?: string;
  lastActivity?: string;
};

// Profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
});

// Security form schema
const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserProfileProps = {
  user: UserProfileData;
  isCurrentUser: boolean;
  canEdit: boolean;
};

export function UserProfile({ user, isCurrentUser, canEdit }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile edit form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      zipCode: user.address?.zipCode || "",
      country: user.address?.country || "",
      bio: user.bio || "",
    }
  });

  // Password change form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  
  // Helper functions
  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'sales': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'dispatch': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'hr': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'finance': 
      case 'accounting': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getRoleLevelName = (level: number) => {
    switch (level) {
      case 1: return 'Representative';
      case 2: return 'Team Lead';
      case 3: return 'Manager';
      case 4: return 'Department Head';
      case 5: return 'Administrator';
      default: return 'Unknown';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Simplified profile display
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="md:flex md:items-start md:gap-6">
            <div className="mb-4 md:mb-0 flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                {canEdit && (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    size="sm"
                    className="h-8"
                  >
                    <Edit className="mr-1 h-4 w-4" /> Edit Profile
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className={cn("text-xs", getDepartmentColor(user.department))}>
                    {user.department}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">
                    {user.role} (Level {user.level})
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Placeholder for dialog forms - not implementing for fix */}
      {isEditingProfile && (
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Form would go here in complete implementation</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button onClick={() => setIsEditingProfile(false)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}