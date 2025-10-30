import React, { useState, useEffect, useMemo, ChangeEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage, AvatarProfile} from "@/components/ui/avatar";
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleX, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Location = {
  id: string;
  label: string;
};

type PersonalDetailsStepProps = {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  avatarPreview: string;
  handleAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  removeAvatar: () => void;
  passwordError: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
};

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  formData,
  handleInputChange,
  avatarPreview,
  handleAvatarChange,
  removeAvatar,
  passwordError,
  showPassword,
  setShowPassword,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    const fetchSearchLocations = async () => {
      setIsLocLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('id, label, value')
        .neq('value', 'other')
        .or(`label.ilike.%${locationSearch}%,value.ilike.%${locationSearch}%`)
        .order('label')
        .limit(50); 
      
      if (data) setLocations(data);
      if (error) console.error('Error fetching search locations:', error);
      setIsLocLoading(false);
    };
    
    const fetchInitialLocations = async () => {
       setIsLocLoading(true);
       const { data, error } = await supabase
        .from('locations')
        .select('id, label, value')
        .neq('value', 'other')
        .order('label') // Or order by popularity, etc.
        .limit(10); // Fetch top 10
      
       if (data) setLocations(data);
       if (error) console.error('Error fetching initial locations:', error);
       setIsLocLoading(false);
    };

    // On component mount, fetch the initial list right away
    if (!isMounted.current) {
      isMounted.current = true;
      fetchInitialLocations();
      return; // Exit
    }

    // On subsequent search changes, use the debounce timer
    const searchTimer = setTimeout(() => {
      if (locationSearch.length < 2) {
        fetchInitialLocations(); // Re-fetch initial list if search is cleared
      } else {
        fetchSearchLocations(); // Perform the search
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(searchTimer);

  }, [locationSearch]);

  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations] // Only re-run when the 'locations' state changes
  );

  const formProfile: AvatarProfile = useMemo(() => ({
    // Use a placeholder ID. It won't be used if avatarPreview exists.
    id: formData.email || 'preview-user', 
    full_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
    profile_picture_url: avatarPreview || null // Pass the preview URL here
  }), [formData.firstName, formData.lastName, formData.email, avatarPreview]);
  
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar profile={formProfile} className="w-24 h-24 border-2 border-primary/20">
            <AvatarImage alt="Profile preview" />
            <AvatarFallback className="text-3xl" />
          </Avatar>
          {avatarPreview && (
            <button 
              type="button" 
              onClick={removeAvatar} 
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80 transition-colors"
            >
              <CircleX className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button asChild variant="outline">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Upload Picture
            <input 
              id="avatar-upload" 
              type="file" 
              className="sr-only" 
              accept="image/png, image/jpeg" 
              onChange={handleAvatarChange} 
            />
          </label>
        </Button>
        <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB.</p>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name *</label>
          <Input 
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name *</label>
          <Input 
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address *</label>
        <Input 
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
          <Input 
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div>
          <label htmlFor="dob" className="block text-sm font-medium mb-2">Date of Birth *</label>
          <Input 
            id="dob"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-2">Current Location *</label>
        <SearchableSelect
          // id="location" // Note: SearchableSelect doesn't take id directly, this label is for context
          options={locationOptions}
          value={formData.location_id}
          onValueChange={(value) => handleInputChange('location_id', value)}
          onSearchChange={setLocationSearch}
          isLoading={isLocLoading}
          placeholder="Select your city/town"
          searchPlaceholder="Search locations... (min 2 chars)"
          emptyMessage="No location found."
        />
        {formData.location_id === 'other' && (
          <div className="mt-2">
            <Input
              value={formData.location_other || ''}
              onChange={(e) => handleInputChange('location_other', e.target.value)}
              placeholder="Please specify your location"
              required
            />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* ✅ FIX: Updated Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">Password *</label>
          <div className="relative">
            <Input 
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              required
              minLength={6}
            />
            <Button
              type="button" 
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1} 
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Must be at least 6 characters long.
          </p>
        </div>

        {/* ✅ FIX: Updated Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password *</label>
          <div className="relative">
            <Input 
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={6}
            />
            <Button
              type="button" 
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1} // Keeps it out of the keyboard tab order
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {/* This is the real-time error message */}
          {passwordError && (
            <p className="text-sm text-destructive mt-1">{passwordError}</p>
          )}
        </div>
      </div>
    </>
  );
};
