import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define the NotificationPreferences interface
interface NotificationPreferences {
  email: boolean;
  slack: boolean;
  sms: boolean;
  inApp: boolean;
  whatsapp: boolean;
  teamNotifications: {
    leadUpdates: boolean;
    loadUpdates: boolean;
    invoiceUpdates: boolean;
    dailySummaries: boolean;
  };
}

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  email: true,
  slack: true,
  sms: false,
  inApp: true,
  whatsapp: false,
  teamNotifications: {
    leadUpdates: true,
    loadUpdates: true,
    invoiceUpdates: true,
    dailySummaries: true
  }
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notification settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/notification-settings'],
    queryFn: async () => {
      const result = await apiRequest({
        url: '/api/notification-settings',
        method: 'GET'
      });
      return result as NotificationPreferences;
    }
  });

  // Update notification preferences
  const updateMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      return apiRequest({
        url: '/api/notification-settings',
        method: 'POST',
        body: JSON.stringify(preferences)
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update preferences",
        description: "An error occurred while saving your notification settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Set preferences when data is loaded
  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  // Check if all main options are selected
  useEffect(() => {
    const mainOptions = ['email', 'slack', 'sms', 'inApp', 'whatsapp'];
    const allSelected = mainOptions.every(option => preferences[option as keyof typeof preferences]);
    setIsAllSelected(allSelected);
  }, [preferences]);

  // Check if there are unsaved changes
  useEffect(() => {
    if (data) {
      const hasChanged = JSON.stringify(data) !== JSON.stringify(preferences);
      setHasChanges(hasChanged);
    }
  }, [data, preferences]);

  // Handle channel change
  const handleChannelChange = (channel: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  // Handle team notification change
  const handleTeamNotificationChange = (key: keyof typeof preferences.teamNotifications) => {
    setPreferences(prev => ({
      ...prev,
      teamNotifications: {
        ...prev.teamNotifications,
        [key]: !prev.teamNotifications[key]
      }
    }));
  };

  // Handle select all
  const handleSelectAll = () => {
    const newValue = !isAllSelected;
    setPreferences(prev => ({
      ...prev,
      email: newValue,
      slack: newValue,
      sms: newValue,
      inApp: newValue,
      whatsapp: newValue
    }));
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading your notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Error loading notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">An error occurred while loading your notification preferences. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Choose how you want to receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Select All Channels</Label>
              <Switch
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email}
                  onCheckedChange={() => handleChannelChange('email')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slack-notifications" className="font-medium">Slack</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications in Slack</p>
                </div>
                <Switch
                  id="slack-notifications"
                  checked={preferences.slack}
                  onCheckedChange={() => handleChannelChange('slack')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications" className="font-medium">SMS</Label>
                  <p className="text-sm text-muted-foreground">Receive text message notifications</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.sms}
                  onCheckedChange={() => handleChannelChange('sms')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="app-notifications" className="font-medium">In-App</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                </div>
                <Switch
                  id="app-notifications"
                  checked={preferences.inApp}
                  onCheckedChange={() => handleChannelChange('inApp')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp-notifications" className="font-medium">WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Receive WhatsApp notifications</p>
                </div>
                <Switch
                  id="whatsapp-notifications"
                  checked={preferences.whatsapp}
                  onCheckedChange={() => handleChannelChange('whatsapp')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Team Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lead-updates" className="font-medium">Lead Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about lead status changes</p>
                </div>
                <Switch
                  id="lead-updates"
                  checked={preferences.teamNotifications.leadUpdates}
                  onCheckedChange={() => handleTeamNotificationChange('leadUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="load-updates" className="font-medium">Load Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about load status changes</p>
                </div>
                <Switch
                  id="load-updates"
                  checked={preferences.teamNotifications.loadUpdates}
                  onCheckedChange={() => handleTeamNotificationChange('loadUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="invoice-updates" className="font-medium">Invoice Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about invoice status changes</p>
                </div>
                <Switch
                  id="invoice-updates"
                  checked={preferences.teamNotifications.invoiceUpdates}
                  onCheckedChange={() => handleTeamNotificationChange('invoiceUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-summaries" className="font-medium">Daily Summaries</Label>
                  <p className="text-sm text-muted-foreground">Receive daily summary reports</p>
                </div>
                <Switch
                  id="daily-summaries"
                  checked={preferences.teamNotifications.dailySummaries}
                  onCheckedChange={() => handleTeamNotificationChange('dailySummaries')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}