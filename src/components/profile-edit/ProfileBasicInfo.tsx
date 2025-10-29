import React from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';

type ProfileBasicInfoProps = {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  locationOptions: { value: string; label: string }[];
  onLocationSearch: (search: string) => void;
  isLocLoading: boolean;
};

export const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  formData,
  onInputChange,
  locationOptions,
  onLocationSearch,
  isLocLoading
}) => {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="space-y-6">
      <div className="font-semibold text-lg">Basic Information</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name *</label>
          <Input value={formData.full_name} onChange={(e) => onInputChange('full_name', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth *</label>
          <Input type="date" value={formData.date_of_birth} onChange={(e) => onInputChange('date_of_birth', e.target.value)} max={today} required />
        </div>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input value={formData.phone} onChange={(e) => onInputChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Location *</label>
          <SearchableSelect
            options={locationOptions}
            value={formData.location_id}
            onValueChange={(v) => onInputChange('location_id', v)}
            onSearchChange={onLocationSearch}
            isLoading={isLocLoading}
            placeholder="Select your location"
            searchPlaceholder="Search locations... (min 2 chars)"
            emptyMessage="No location found."
          />
          {formData.location_id === 'other' && (
            <Input className="mt-2" value={formData.location_other} onChange={(e) => onInputChange('location_other', e.target.value)} placeholder="Please specify location" required />
          )}
        </div>
      </div>
    </div>
  );
};
