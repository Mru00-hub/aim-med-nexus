import React, { ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CircleX, Upload, Trash2 } from 'lucide-react';

// Props are simplified. The parent now decides WHAT to show and WHEN.
type ProfileAvatarProps = {
  displaySrc: string;        // The single, final URL to display (preview, saved, or generated)
  fullName: string;
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearPreview: () => void;
  onRemoveSavedAvatar: () => void;
  showClearPreview: boolean;   // Parent tells us when to show the 'X' button
  showRemoveButton: boolean;   // Parent tells us when to show the 'Remove' button
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  displaySrc,
  fullName,
  onAvatarChange,
  onClearPreview,
  onRemoveSavedAvatar,
  showClearPreview,
  showRemoveButton
}) => {
  // Get initials for the fallback
  const initials = fullName?.split(' ').map(n => n[0]).join('') || '';

  return (
    <div className="flex flex-col items-center mb-8 gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-2 border-primary/20">
          <AvatarImage 
            src={displaySrc} // Use the single source of truth from the parent
            alt={fullName} 
            className="object-cover" 
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        {/* Show 'X' button based on parent's logic */}
        {showClearPreview && (
          <button 
            type="button" 
            onClick={onClearPreview} // <-- FIXED: This was calling the wrong function
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
          >
            <CircleX className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* This button is always shown */}
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

        {/* Show 'Remove' button based on parent's logic */}
        {showRemoveButton && (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemoveSavedAvatar}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
};

