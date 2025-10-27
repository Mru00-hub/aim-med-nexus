import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Stethoscope, Briefcase } from 'lucide-react';

type ProfileModeSelectorProps = {
  profileMode: 'clinical' | 'non_clinical';
  onModeChange: (mode: 'clinical' | 'non_clinical') => void;
};

export const ProfileModeSelector: React.FC<ProfileModeSelectorProps> = ({
  profileMode,
  onModeChange
}) => {
  return (
    <div className="space-y-4">
      <Label className="font-semibold text-lg">Select Your Profile Type</Label>
      <RadioGroup
        value={profileMode}
        onValueChange={onModeChange}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Label htmlFor="mode_clinical">
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              profileMode === 'clinical' ? 'border-primary ring-2 ring-primary' : 'border-border'
            }`}
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="clinical" id="mode_clinical" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Clinical Profile
                </div>
                <p className="text-xs text-muted-foreground">
                  For practicing clinicians, residents, and students. Emphasizes academics, research, and clinical skills.
                </p>
              </div>
            </div>
          </Card>
        </Label>
        
        <Label htmlFor="mode_non_clinical">
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              profileMode === 'non_clinical' ? 'border-primary ring-2 ring-primary' : 'border-border'
            }`}
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="non_clinical" id="mode_non_clinical" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Non-Clinical / Transitioner
                </div>
                <p className="text-xs text-muted-foreground">
                  For entrepreneurs, writers, consultants, and those exploring new careers. Emphasizes ventures, content, and personal brand.
                </p>
              </div>
            </div>
          </Card>
        </Label>
      </RadioGroup>
    </div>
  );
};
