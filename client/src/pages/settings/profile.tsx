import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { UserProfile, UserProfileData } from '@/components/dashboard/UserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { toast } = useToast();
  
  // Fetch the current user profile
  const { data: authData, isLoading: loadingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/auth/me');
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return await res.json();
    }
  });
  
  const userId = authData?.user?.id;
  
  // Fetch full user profile data
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const res = await apiRequest('GET', `/api/users/${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return await res.json();
    },
    enabled: !!userId
  });
  
  const isLoading = loadingAuth || loadingUser || !userData;
  
  // Transform the user data into the format expected by UserProfile
  const userProfileData: UserProfileData | null = userData ? {
    id: userData.id,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    roleId: userData.roleId,
    role: authData?.role?.name || 'User',
    department: authData?.role?.department || 'Unknown',
    level: authData?.role?.level || 1,
    permissions: authData?.role?.permissions || [],
    active: userData.active,
    profileImageUrl: userData.profileImageUrl,
    address: userData.address,
    bio: userData.bio,
  } : null;
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <Helmet>
          <title>User Profile - MetaSys ERP</title>
        </Helmet>
        
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userProfileData) {
    return (
      <div className="container py-6">
        <Helmet>
          <title>Profile Not Found - MetaSys ERP</title>
        </Helmet>
        
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p>User profile not found. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <Helmet>
        <title>{`${userProfileData.firstName} ${userProfileData.lastName}'s Profile - MetaSys ERP`}</title>
      </Helmet>
      
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <UserProfile 
        user={userProfileData} 
        isCurrentUser={true}
        canEdit={true}
      />
    </div>
  );
}