import React from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileProfessionalInfoProps = {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  specializationOptions: { value: string; label: string }[];
  onSpecializationSearch: (search: string) => void;
  isSpecLoading: boolean;
  experiences: { value: string; label: string }[];
};

export const ProfileProfessionalInfo: React.FC<ProfileProfessionalInfoProps> = ({
  formData,
  onInputChange,
  specializationOptions,
  onSpecializationSearch,
  isSpecLoading,
  experiences
}) => {
  return (
    <div className="space-y-6">
      <div className="font-semibold text-lg">Professional Details</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current Position *</label>
          <Input value={formData.current_position} onChange={(e) => onInputChange('current_position', e.target.value)} placeholder="e.g., Resident Doctor" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Organization *</label>
          <Input value={formData.organization} onChange={(e) => onInputChange('organization', e.target.value)} placeholder="e.g., City Hospital" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Field/Domain (Specialization) *</label>
        <SearchableSelect
          options={specializationOptions}
          value={formData.specialization_id}
          onValueChange={(v) => onInputChange('specialization_id', v)}
          onSearchChange={onSpecializationSearch}
          isLoading={isSpecLoading}
          placeholder="Select your specialization"
          searchPlaceholder="Search specializations... (min 2 chars)"
          emptyMessage="No specialization found."
        />
        {formData.specialization_id === 'other' && (
          <Input className="mt-2" value={formData.specialization_other} onChange={(e) => onInputChange('specialization_other', e.target.value)} placeholder="Please specify specialization" required />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Experience Level *</label>
        <Select value={formData.experience_level_value} onValueChange={(v) => onInputChange('experience_level_value', v)}>
          <SelectTrigger><SelectValue placeholder="Select your experience" /></SelectTrigger>
          <SelectContent>
            {experiences.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Medical License</label>
        <Input value={formData.medical_license} onChange={(e) => onInputChange('medical_license', e.target.value)} placeholder="Your license number (if applicable)" />
      </div>
    </div>
  );
};
