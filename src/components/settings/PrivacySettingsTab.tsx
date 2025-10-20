import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define the structure of your privacy settings
type PrivacySettings = {
  [key: string]: 'public' | 'connections' | 'private';
};

// ✅ UPDATED: Match your new normalized schema
const privacyFields: { key: keyof PrivacySettings, label: string, description?: string }[] = [
  { key: 'email', label: 'Email Address', description: 'Your contact email' },
  { key: 'phone', label: 'Phone Number', description: 'Your contact phone' },
  { key: 'date_of_birth', label: 'Date of Birth & Age', description: 'Your age will be calculated from this' },
  { key: 'current_location', label: 'Current Location', description: 'City, state, or country' },
  { key: 'current_position', label: 'Current Position', description: 'Your job title' },
  { key: 'organization', label: 'Organization', description: 'Your workplace or company' },
  { key: 'bio', label: 'Professional Bio', description: 'Your about section' },
  // ✅ Educational fields
  { key: 'institution', label: 'Educational Institution', description: 'Your university or college' },
  { key: 'course', label: 'Course/Program', description: 'Your degree or program' },
  { key: 'year_of_study', label: 'Year/Status', description: 'Current year or graduation status' },
  // ✅ Professional fields
  { key: 'specialization', label: 'Specialization/Field', description: 'Your area of expertise' },
  { key: 'years_experience', label: 'Years of Experience', description: 'Your experience level' },
  { key: 'medical_license', label: 'Medical License', description: 'Your license number' },
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
            // ✅ More sensible defaults
            if (field.key === 'email' || field.key === 'phone' || field.key === 'date_of_birth') {
              defaultSettings[field.key] = 'connections'; // Sensitive info
            } else {
              defaultSettings[field.key] = 'public'; // Professional info
            }
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
      toast.success('Privacy settings updated successfully!');
    }
    setIsSaving(false);
  };

  // ✅ Helper to get visual indicator
  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public':
        return '🌍';
      case 'connections':
        return '👥';
      case 'private':
        return '🔒';
      default:
        return '❓';
    }
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Privacy Settings</CardTitle>
        <CardDescription>
          Control who can see different parts of your profile. Changes take effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ✅ Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Public:</strong> Everyone can see • <strong>Connections:</strong> Only your connections • <strong>Private:</strong> Only you
          </AlertDescription>
        </Alert>

        {/* ✅ Grouped Sections */}
        <div className="space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-4">
              {privacyFields.filter(f => ['email', 'phone'].includes(f.key)).map((field) => (
                <PrivacyFieldRow 
                  key={field.key}
                  field={field}
                  value={settings[field.key] || 'private'}
                  onChange={handleSettingChange}
                  getIcon={getPrivacyIcon}
                />
              ))}
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Personal Details
            </h3>
            <div className="space-y-4">
              {privacyFields.filter(f => ['date_of_birth', 'current_location', 'bio'].includes(f.key)).map((field) => (
                <PrivacyFieldRow 
                  key={field.key}
                  field={field}
                  value={settings[field.key] || 'public'}
                  onChange={handleSettingChange}
                  getIcon={getPrivacyIcon}
                />
              ))}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Professional Information
            </h3>
            <div className="space-y-4">
              {privacyFields.filter(f => ['current_position', 'organization', 'specialization', 'years_experience', 'medical_license'].includes(f.key)).map((field) => (
                <PrivacyFieldRow 
                  key={field.key}
                  field={field}
                  value={settings[field.key] || 'public'}
                  onChange={handleSettingChange}
                  getIcon={getPrivacyIcon}
                />
              ))}
            </div>
          </div>

          {/* Educational Information */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Educational Information
            </h3>
            <div className="space-y-4">
              {privacyFields.filter(f => ['institution', 'course', 'year_of_study'].includes(f.key)).map((field) => (
                <PrivacyFieldRow 
                  key={field.key}
                  field={field}
                  value={settings[field.key] || 'public'}
                  onChange={handleSettingChange}
                  getIcon={getPrivacyIcon}
                />
              ))}
            </div>
          </div>
        </div>
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

// ✅ Extracted Component for Each Privacy Row
const PrivacyFieldRow = ({ 
  field, 
  value, 
  onChange, 
  getIcon 
}: { 
  field: { key: string; label: string; description?: string };
  value: 'public' | 'connections' | 'private';
  onChange: (field: string, value: 'public' | 'connections' | 'private') => void;
  getIcon: (level: string) => string;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{getIcon(value)}</span>
        <label className="text-sm font-medium">
          {field.label}
        </label>
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          {field.description}
        </p>
      )}
    </div>
    <Select
      value={value}
      onValueChange={(val: 'public' | 'connections' | 'private') => 
        onChange(field.key, val)
      }
    >
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Select privacy" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">🌍 Public</SelectItem>
        <SelectItem value="connections">👥 Connections</SelectItem>
        <SelectItem value="private">🔒 Private</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default PrivacySettingsTab;
