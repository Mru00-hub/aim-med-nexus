import React, { ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CircleX, Upload, Trash2 } from 'lucide-react';

type ProfileAvatarProps = {
  avatarPreview: string;
  avatarUrl: string;
  fullName: string;
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearPreview: () => void;   // Renamed: This clears the preview
  onRemoveSavedAvatar: () => void;
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarPreview,
  avatarUrl,
  fullName,
  onAvatarChange,
  onClearPreview, // This was 'onRemoveAvatar'
  onRemoveSavedAvatar
}) => {
  const displaySrc = avatarPreview || avatarUrl;
  // Get initials for the fallback
  const initials = fullName?.split(' ').map(n => n[0]).join('') || '';
  return (
    <div className="flex flex-col items-center mb-8 gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-2 border-primary/20">
          <AvatarImage 
            src={avatarPreview || avatarUrl} 
            alt={fullName} 
            className="object-cover" 
          />
          <AvatarFallback>{fullName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        {avatarPreview && (
          <button type="button" onClick={onRemoveAvatar} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80">
            <CircleX className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* This is the "Change Picture" button */}
        <Button asChild variant="outline">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Change Picture
            <input 
              id="avatar-upload" 
              type="file" 
              className="sr-only" 
              accept="image/png, image/jpeg" 
              onChange={onAvatarChange} 
            />
          </label>
        </Button>

        {/* --- THIS IS THE NEW "REMOVE" BUTTON --- */}
        {/* Show this button ONLY if:
          1. A saved picture exists (avatarUrl)
          2. The user is NOT currently previewing a new picture (!avatarPreview)
        */}
        {avatarUrl && !avatarPreview && (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemoveSavedAvatar} // Use the new handler
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
};
