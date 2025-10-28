// src/components/profile-edit/ProfileEducationHistoryForm.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { EducationHistoryItem } from '@/pages/CompleteProfile';
// --- IMPORT SearchableSelect ---
import { SearchableSelect } from '@/components/ui/searchable-select';

type ProfileEducationHistoryFormProps = {
  items: EducationHistoryItem[];
  onListChange: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  // --- ADD DROPDOWN PROPS ---
  institutionOptions: { value: string; label: string }[];
  onInstitutionSearch: (search: string) => void;
  isInstLoading: boolean;
  // Optional: Add props for course/specialization if making 'Field of Study' searchable
  courseOptions?: { value: string; label: string }[];
  onCourseSearch?: (search: string) => void;
  isCourseLoading?: boolean;
};

export const ProfileEducationHistoryForm: React.FC<ProfileEducationHistoryFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem,
  // --- Destructure new props ---
  institutionOptions,
  onInstitutionSearch,
  isInstLoading,
  courseOptions,
  onCourseSearch,
  isCourseLoading,
}) => {

  // Helper to handle 'other' logic for SearchableSelect
  const handleSelectChange = (index: number, fieldId: string, fieldOther: string, value: string) => {
    onListChange(index, fieldId, value);
    // If 'other' is selected, don't clear the 'other' input.
    // If a real ID is selected, clear the 'other' input.
    if (value !== 'other') {
      onListChange(index, fieldOther, ''); // Clear the 'other' field
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.id || index}>
          <CardContent className="p-4 space-y-3 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div>
              <label className="block text-sm font-medium mb-1">Educational Institution *</label>
              {/* --- USE SearchableSelect FOR INSTITUTION --- */}
              <SearchableSelect
                options={institutionOptions}
                // Check if item has institution_id, otherwise fall back to 'other' if institution_name exists
                value={item.institution_id || (item.institution_name ? 'other' : '')}
                onValueChange={(v) => handleSelectChange(index, 'institution_id', 'institution_name', v)}
                onSearchChange={onInstitutionSearch}
                isLoading={isInstLoading}
                placeholder="Select institution"
                searchPlaceholder="Search institutions..."
                emptyMessage="No institution found."
              />
              {/* Show 'other' input if 'other' is selected OR if no ID is set but a name exists */}
              {(item.institution_id === 'other' || (!item.institution_id && item.institution_name)) && (
                <Input
                  className="mt-2"
                  value={item.institution_name || ''} // Use institution_name for the 'other' text
                  onChange={(e) => onListChange(index, 'institution_name', e.target.value)}
                  placeholder="Please specify institution name"
                  required={item.institution_id === 'other'} // Only required if 'other' is explicitly selected
                />
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Degree</label>
                <Input
                  value={item.degree || ''}
                  onChange={(e) => onListChange(index, 'degree', e.target.value)}
                  placeholder="e.g., MBBS, MD, PhD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field of Study</label>
                {/* --- EXAMPLE: Use SearchableSelect for Field of Study (using courseOptions) --- */}
                {/* Adjust props/logic if using specializations or just Input */}
                {courseOptions && onCourseSearch && typeof isCourseLoading !== 'undefined' ? (
                   <>
                    <SearchableSelect
                        options={courseOptions}
                        value={item.course_id || (item.field_of_study ? 'other' : '')} // Assuming you add course_id to EducationHistoryItem type/table
                        onValueChange={(v) => handleSelectChange(index, 'course_id', 'field_of_study', v)}
                        onSearchChange={onCourseSearch}
                        isLoading={isCourseLoading}
                        placeholder="Select field of study"
                        searchPlaceholder="Search fields..."
                        emptyMessage="No field found."
                    />
                    {(item.course_id === 'other' || (!item.course_id && item.field_of_study)) && (
                        <Input
                        className="mt-2"
                        value={item.field_of_study || ''} // Use field_of_study for the 'other' text
                        onChange={(e) => onListChange(index, 'field_of_study', e.target.value)}
                        placeholder="Please specify field of study"
                        required={item.course_id === 'other'}
                        />
                    )}
                   </>
                ) : (
                  // Fallback to simple Input if dropdowns not provided
                  <Input
                    value={item.field_of_study || ''}
                    onChange={(e) => onListChange(index, 'field_of_study', e.target.value)}
                    placeholder="e.g., Cardiology, Public Health"
                  />
                )}
              </div>
            </div>

             <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Year</label>
                <Input
                  type="number"
                  value={item.start_year || ''}
                  onChange={(e) => onListChange(index, 'start_year', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Year (or expected)</label>
                <Input
                   type="number"
                   value={item.end_year || ''}
                   onChange={(e) => onListChange(index, 'end_year', e.target.value ? parseInt(e.target.value) : null)}
                   placeholder="YYYY"
                   min="1900"
                   max={new Date().getFullYear() + 10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description / Activities</label>
              <Textarea
                value={item.description || ''}
                onChange={(e) => onListChange(index, 'description', e.target.value)}
                placeholder="Optional: Mention societies, awards, thesis, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={onAddItem}>
        <Plus className="h-4 w-4 mr-2" /> Add Education
      </Button>
    </div>
  );
};
