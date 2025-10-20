// src/components/settings/NotificationsSettingsTab.tsx

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  NotificationPreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  UpdatePreferencesPayload,
} from '@/integrations/supabase/user.api';
import { AlertCircle, Loader2 } from 'lucide-react';

// --- Skeleton Loader for Settings ---
const SettingsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// --- Reusable Setting Row Component ---
type SettingRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled: boolean;
};

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  checked,
  onToggle,
  disabled,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
    <div className="space-y-0.5">
      <label
        htmlFor={`switch-${title}`}
        className="text-sm font-medium text-foreground"
      >
        {title}
      </label>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch
      id={`switch-${title}`}
      checked={checked}
      onCheckedChange={onToggle}
      disabled={disabled}
    />
  </div>
);

// --- Main Settings Tab Component ---
export const NotificationsSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getNotificationPreferences();
        setPreferences(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load your notification settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  // --- API Mutation Handler ---
  const handleToggle = async (
    key: keyof UpdatePreferencesPayload,
    value: boolean
  ) => {
    if (!preferences) return;

    // 1. Optimistic UI update
    const originalPreferences = { ...preferences };
    setPreferences({ ...preferences, [key]: value });
    setIsSaving(true);

    try {
      // 2. Call API
      await updateNotificationPreferences({ [key]: value });
      toast({
        title: 'Settings Saved',
        description: `${key.replace(/_/g, ' ')} has been ${
          value ? 'enabled' : 'disabled'
        }.`,
      });
    } catch (err: any) {
      // 3. Revert on error
      setPreferences(originalPreferences);
      toast({
        title: 'Error',
        description: `Failed to save setting: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!preferences) {
    return <p>No settings found.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how you receive alerts and notifications.
          {isSaving && (
            <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingRow
          title="Enable Email Notifications"
          description="Receive a summary of your notifications via email."
          checked={preferences.email_enabled}
          onToggle={(value) => handleToggle('email_enabled', value)}
          disabled={isSaving}
        />

        <Separator />

        <h3 className="text-lg font-medium text-foreground">
          Activity Notifications
        </h3>
        <p className="text-sm text-muted-foreground -mt-4">
          Control alerts for specific activities on the platform.
        </p>

        <SettingRow
          title="Forum & Space Updates"
          description="Notify me about new public threads, spaces, and replies."
          checked={preferences.forum_updates}
          onToggle={(value) => handleToggle('forum_updates', value)}
          disabled={isSaving}
        />

        <SettingRow
          title="Connection Requests"
          description="Notify me about new connection requests and acceptances."
          checked={preferences.connection_requests}
          onToggle={(value) => handleToggle('connection_requests', value)}
          disabled={isSaving}
        />

        <SettingRow
          title="Job Alerts"
          description="Notify me about new job postings and application updates."
          checked={preferences.job_alerts}
          onToggle={(value) => handleToggle('job_alerts', value)}
          disabled={isSaving}
        />
      </CardContent>
    </Card>
  );
};
