import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Define notification preferences type
type NotificationPreferences = {
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
};

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
  const { toast } = useToast();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch notification preferences
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/notification-settings'],
    enabled: !!user,
    placeholderData: defaultPreferences
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

  // Update a channel preference
  const handleChannelChange = (channel: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  // Update a team notification preference
  const handleTeamNotificationChange = (option: keyof NotificationPreferences['teamNotifications']) => {
    setPreferences(prev => ({
      ...prev,
      teamNotifications: {
        ...prev.teamNotifications,
        [option]: !prev.teamNotifications[option]
      }
    }));
  };

  // Toggle all main options
  const toggleAllChannels = () => {
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

  // Toggle all team notifications
  const toggleAllTeamNotifications = () => {
    const allTeamSelected = Object.values(preferences.teamNotifications).every(v => v);
    const newValue = !allTeamSelected;
    
    setPreferences(prev => ({
      ...prev,
      teamNotifications: {
        leadUpdates: newValue,
        loadUpdates: newValue,
        invoiceUpdates: newValue,
        dailySummaries: newValue
      }
    }));
  };

  // Save changes
  const saveChanges = () => {
    updateMutation.mutate(preferences);
  };

  // Reset to default preferences
  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load notification preferences. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications from the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">All Channels</div>
              <div className="text-sm text-muted-foreground">Enable or disable all notification channels</div>
            </div>
            <Switch
              checked={isAllSelected}
              onCheckedChange={toggleAllChannels}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
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
                <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
              </div>
              <Switch
                id="whatsapp-notifications"
                checked={preferences.whatsapp}
                onCheckedChange={() => handleChannelChange('whatsapp')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Notifications</CardTitle>
          <CardDescription>
            Choose which team-wide notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">All Team Notifications</div>
              <div className="text-sm text-muted-foreground">Enable or disable all team notifications</div>
            </div>
            <Switch
              checked={Object.values(preferences.teamNotifications).every(v => v)}
              onCheckedChange={toggleAllTeamNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lead-updates" className="font-medium">Lead Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications about new and updated leads</p>
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
                <p className="text-sm text-muted-foreground">Notifications about new and updated loads</p>
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
                <p className="text-sm text-muted-foreground">Notifications about new and updated invoices</p>
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
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}