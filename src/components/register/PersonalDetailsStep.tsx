import React, { useState, useEffect, useMemo ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleX, Upload } from 'lucide-react';
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
};

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  formData,
  handleInputChange,
  avatarPreview,
  handleAvatarChange,
  removeAvatar,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);

  useEffect(() => {
    setIsLocLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchLocations = async () => {
        if (locationSearch.length < 2) {
          // Don't search if the query is too short
          setLocations([]);
          setIsLocLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('locations')
          .select('id, label')
          .neq('id', 'other')
          // .or() searches multiple columns
          // .ilike() is a case-insensitive "contains" search
          .or(`label.ilike.%${locationSearch}%,id.ilike.%${locationSearch}%`)
          .order('label')
          .limit(50); // Limit results to keep it fast

        if (data) setLocations(data);
        if (error) console.error('Error fetching locations:', error);
        
        // We're done loading
        setIsLocLoading(false);
      };

      fetchLocations();
    }, 500); // 500ms debounce

    // This is the cleanup function. It clears the timer
    // if the user types again before 500ms is up.
    return () => clearTimeout(searchTimer);

  }, [locationSearch]);

  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations] // Only re-run when the 'locations' state changes
  );
  
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            <AvatarImage src={avatarPreview} alt="Profile preview" />
            <AvatarFallback className="text-3xl">
              {formData.firstName?.[0]}{formData.lastName?.[0]}
            </AvatarFallback>
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
          <label className="block text-sm font-medium mb-2">First Name *</label>
          <Input 
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Last Name *</label>
          <Input 
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email Address *</label>
        <Input 
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <Input 
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth *</label>
          <Input 
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Current Location *</label>
        <SearchableSelect
          options={locationOptions}
          value={formData.location_id}
          onValueChange={(value) => handleInputChange('location_id', value)}
          onSearchChange={setLocationSearch}
          isLoading={isLocLoading}
          placeholder="Select your city/town"
          searchPlaceholder="Search locations..."
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
        <div>
          <label className="block text-sm font-medium mb-2">Password *</label>
          <Input 
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a strong password"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password *</label>
          <Input 
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            required
            minLength={6}
          />
        </div>
      </div>
    </>
  );
};
