import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditableTransition } from '@/integrations/supabase/user.api';

type ProfileTransitionInfoProps = {
  formData: EditableTransition;
  onTransitionChange: (field: string, value: any) => void;
};

export const ProfileTransitionInfo: React.FC<ProfileTransitionInfoProps> = ({
  formData,
  onTransitionChange
}) => {
  return (
    <div className="p-1 pt-4 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transition-status">Transition Status</Label>
          <Select
            value={formData.transition_status || ''}
            onValueChange={(val) => onTransitionChange('transition_status', val)}
          >
            <SelectTrigger id="transition-status"><SelectValue placeholder="Select your status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exploring">Exploring Options</SelectItem>
              <SelectItem value="transitioning">Actively Transitioning</SelectItem>
              <SelectItem value="established">Established in New Career</SelectItem>
              <SelectItem value="hybrid">Hybrid (Clinical & Non-Clinical)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transition-date">Transition Start Date</Label>
          <Input
            id="transition-date"
            type="date"
            value={formData.transition_date || ''}
            onChange={(e) => onTransitionChange('transition_date', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="transition-story">My Transition Story</Label>
        <Textarea
          id="transition-story"
          value={formData.transition_story || ''}
          onChange={(e) => onTransitionChange('transition_story', e.target.value)}
          placeholder="Share your 'why' and your journey from clinical practice to your new path..."
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-industries">Target Industries (comma-separated)</Label>
        <Input
          id="target-industries"
          value={Array.isArray(formData.target_industries) ? formData.target_industries.join(', ') : ''}
          onChange={(e) => onTransitionChange('target_industries', e.target.value)}
          placeholder="e.g., Medtech, Healthcare Consulting, Medical Writing"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="open-to-ops" className="font-medium">Open to Opportunities</Label>
          <Switch
            id="open-to-ops"
            checked={formData.open_to_opportunities || false}
            onCheckedChange={(val) => onTransitionChange('open_to_opportunities', val)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="seeking-mentor" className="font-medium">Seeking Mentorship</Label>
          <Switch
            id="seeking-mentor"
            checked={formData.seeking_mentorship || false}
            onCheckedChange={(val) => onTransitionChange('seeking_mentorship', val)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <Label htmlFor="offering-mentor" className="font-medium">Offering Mentorship</Label>
          <Switch
            id="offering-mentor"
            checked={formData.offering_mentorship || false}
            onCheckedChange={(val) => onTransitionChange('offering_mentorship', val)}
          />
        </div>
      </div>
    </div>
  );
};
