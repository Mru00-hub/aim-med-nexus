import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

// Define the structure of your privacy settings
type PrivacySettings = {
  [key: string]: 'public' | 'connections' | 'private';
};

// Define the fields the user can control
const privacyFields: { key: keyof PrivacySettings, label: string }[] = [
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'date_of_birth', label: 'Date of Birth & Age' },
  { key: 'current_location', label: 'Current Location' },
  { key: 'current_position', label: 'Current Position' },
  { key: 'organization', label: 'Organization' },
  { key: 'institution', label: 'Educational Institution' },
  { key: 'course', label: 'Course/Program' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'bio', label: 'Professional Bio' },
  { key: 'years_experience', label: 'Work Experience' },
];

const PrivacySettingsTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings on load
  useEffect(() => {
    if (user) {
      const fetchPrivacySettings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('privacy_settings')
          .eq('id', user.id)
          .single();
        
        if (error) {
          toast.error('Failed to load privacy settings.');
          console.error(error);
        } else if (data?.privacy_settings) {
          setSettings(data.privacy_settings as PrivacySettings);
        } else {
          // No settings found, apply defaults
          const defaultSettings: PrivacySettings = {};
          privacyFields.forEach(field => {
            defaultSettings[field.key] = 'connections'; // Default to 'connections'
          });
          setSettings(defaultSettings);
        }
        setIsLoading(false);
      };
      fetchPrivacySettings();
    }
  }, [user]);

  const handleSettingChange = (field: string, value: 'public' | 'connections' | 'private') => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: settings })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save settings.');
      console.error(error);
    } else {
      toast.success('Privacy settings updated!');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Privacy</CardTitle>
        <CardDescription>
          Choose who can see the different parts of your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {privacyFields.map((field) => (
          <div key={field.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium mb-2 sm:mb-0">
              {field.label}
            </label>
            <Select
              value={settings[field.key] || 'private'}
              onValueChange={(value: 'public' | 'connections' | 'private') => 
                handleSettingChange(field.key, value)
              }
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select privacy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (Everyone)</SelectItem>
                <SelectItem value="connections">Connections Only</SelectItem>
                <SelectItem value="private">Private (Only Me)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end bg-muted/50 p-4">
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrivacySettingsTab;
