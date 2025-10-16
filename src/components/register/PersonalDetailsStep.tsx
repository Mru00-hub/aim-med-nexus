import React, { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleX, Upload } from 'lucide-react';
import { locations } from './_data'; // We'll create this file next

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
            <input id="avatar-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleAvatarChange} />
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
          <label className="block text-sm font-medium mb-2">Current Location *</label>
          <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your city/town" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              {locations.map(loc => <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {formData.location === 'other' && (
            <div className="mt-2">
              <Input
                value={formData.otherLocation}
                onChange={(e) => handleInputChange('otherLocation', e.target.value)}
                placeholder="Please specify your location"
                required
              />
            </div>
          )}
        </div>
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
          />
        </div>
      </div>
    </>
  );
};
