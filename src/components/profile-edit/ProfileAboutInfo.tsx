import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProfileAboutInfoProps = {
  formData: any;
  onInputChange: (field: string, value: string) => void;
};

export const ProfileAboutInfo: React.FC<ProfileAboutInfoProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="font-semibold text-lg">About & Links</div>
      <div>
        <label className="block text-sm font-medium mb-2">Professional Bio</label>
        <Textarea value={formData.bio} onChange={(e) => onInputChange('bio', e.targe.value)} placeholder="A brief summary..." rows={4} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
        <Textarea value={formData.skills} onChange={(e) => onInputChange('skills', e.target.value)} placeholder="e.g., Cardiology, Python" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Resume/CV URL</label>
        <Input type="url" value={formData.resume_url} onChange={(e) => onInputChange('resume_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
      </div>
    </div>
  );
};
