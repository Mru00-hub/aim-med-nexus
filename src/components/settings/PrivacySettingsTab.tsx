import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PrivacySettings = {
  [key: string]: 'public' | 'connections' | 'private';
};

const privacyFields: { key: keyof PrivacySettings, label: string, description?: string }[] = [
  { key: 'email', label: 'Email Address', description: 'Your contact email' },
  { key: 'phone', label: 'Phone Number', description: 'Your contact phone' },
  { key: 'date_of_birth', label: 'Date of Birth & Age', description: 'Your age will be calculated from this' },
  { key: 'current_location', label: 'Current Location', description: 'City, state, or country' },
  { key: 'current_position', label: 'Current Position', description: 'Your job title' },
  { key: 'organization', label: 'Organization', description: 'Your workplace or company' },
  { key: 'bio', label: 'Professional Bio', description: 'Your about section' },
  { key: 'institution', label: 'Educational Institution', description: 'Your university or college' },
  { key: 'course', label: 'Course/Program', description: 'Your degree or program' },
  { key: 'year_of_study', label: 'Year/Status', description: 'Current year or graduation status' },
  { key: 'specialization', label: 'Specialization/Field', description: 'Your area of expertise' },
  { key: 'years_experience', label: 'Years of Experience', description: 'Your experience level' },
  { key: 'medical_license', label: 'Medical License', description: 'Your license number' },
];

const PrivacySettingsTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Fetching privacy settings for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching settings:', error);
        throw error;
      }

      console.log('✅ Raw data from database:', data);
      console.log('📦 privacy_settings value:', data?.privacy_settings);
      console.log('📦 privacy_settings type:', typeof data?.privacy_settings);

      let loadedSettings: PrivacySettings;

      if (data?.privacy_settings && typeof data.privacy_settings === 'object' && Object.keys(data.privacy_settings).length > 0) {
        loadedSettings = data.privacy_settings as PrivacySettings;
        console.log('✅ Loaded existing settings:', loadedSettings);
      } else {
        loadedSettings = getDefaultSettings();
        console.log('⚠️ No settings found, using defaults:', loadedSettings);
      }
      
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      
    } catch (error) {
      console.error('❌ Error in fetchPrivacySettings:', error);
      toast.error('Failed to load privacy settings.');
      const defaults = getDefaultSettings();
      setSettings(defaults);
      setOriginalSettings(defaults);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultSettings = (): PrivacySettings => {
    const defaults: PrivacySettings = {};
    privacyFields.forEach(field => {
      if (['email', 'phone', 'date_of_birth', 'medical_license'].includes(field.key)) {
        defaults[field.key] = 'connections';
      } else {
        defaults[field.key] = 'public';
      }
    });
    return defaults;
  };

  const handleSettingChange = (field: string, value: 'public' | 'connections' | 'private') => {
    console.log(`🔄 Changing ${field} to ${value}`);
    setSettings(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };
      console.log('📝 Updated settings state:', updated);
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (!user) {
      toast.error('You must be logged in to save settings.');
      return;
    }

    if (!hasChanges) {
      toast.info('No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Attempting to save settings...');
      console.log('📤 Settings to save:', settings);
      
      // Create a clean object to save
      const settingsToSave: Record<string, string> = {};
      Object.keys(settings).forEach(key => {
        settingsToSave[key] = settings[key];
      });

      console.log('📤 Cleaned settings object:', settingsToSave);

      // Save to database
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          privacy_settings: settingsToSave
        })
        .eq('id', user.id)
        .select('privacy_settings');

      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }
      
      console.log('✅ Save response:', data);
      
      // Verify the save
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log('🔍 Verified saved data:', verifyData?.privacy_settings);
        
        if (JSON.stringify(verifyData?.privacy_settings) === JSON.stringify(settingsToSave)) {
          console.log('✅ Settings verified successfully!');
          setOriginalSettings(settings);
          toast.success('Privacy settings saved successfully!');
        } else {
          console.error('⚠️ Saved data does not match!');
          console.log('Expected:', settingsToSave);
          console.log('Got:', verifyData?.privacy_settings);
          toast.warning('Settings saved but verification failed. Please refresh.');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error saving privacy settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 Resetting to original settings');
    setSettings(originalSettings);
  };

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
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Profile Privacy Settings</CardTitle>
            <CardDescription>
              Control who can see different parts of your profile. Changes are saved to your account.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchPrivacySettings}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Public:</strong> Everyone can see • <strong>Connections:</strong> Only your connections • <strong>Private:</strong> Only you
          </AlertDescription>
        </Alert>

        {hasChanges && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>You have unsaved changes</span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Discard Changes
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {/* Contact Information */}
          <PrivacySection 
            title="Contact Information"
            fields={privacyFields.filter(f => ['email', 'phone'].includes(f.key))}
            settings={settings}
            onChange={handleSettingChange}
            getIcon={getPrivacyIcon}
          />

          {/* Personal Details */}
          <PrivacySection 
            title="Personal Details"
            fields={privacyFields.filter(f => ['date_of_birth', 'current_location', 'bio'].includes(f.key))}
            settings={settings}
            onChange={handleSettingChange}
            getIcon={getPrivacyIcon}
          />

          {/* Professional Information */}
          <PrivacySection 
            title="Professional Information"
            fields={privacyFields.filter(f => ['current_position', 'organization', 'specialization', 'years_experience', 'medical_license'].includes(f.key))}
            settings={settings}
            onChange={handleSettingChange}
            getIcon={getPrivacyIcon}
          />

          {/* Educational Information */}
          <PrivacySection 
            title="Educational Information"
            fields={privacyFields.filter(f => ['institution', 'course', 'year_of_study'].includes(f.key))}
            settings={settings}
            onChange={handleSettingChange}
            getIcon={getPrivacyIcon}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 p-4">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? '⚠️ Unsaved changes' : '✅ All changes saved'}
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving || !hasChanges}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

const PrivacySection = ({ 
  title, 
  fields, 
  settings, 
  onChange, 
  getIcon 
}: {
  title: string;
  fields: { key: string; label: string; description?: string }[];
  settings: PrivacySettings;
  onChange: (field: string, value: 'public' | 'connections' | 'private') => void;
  getIcon: (level: string) => string;
}) => (
  <div>
    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
      {title}
    </h3>
    <div className="space-y-4">
      {fields.map((field) => (
        <PrivacyFieldRow 
          key={field.key}
          field={field}
          value={settings[field.key] || 'public'}
          onChange={onChange}
          getIcon={getIcon}
        />
      ))}
    </div>
  </div>
);

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
