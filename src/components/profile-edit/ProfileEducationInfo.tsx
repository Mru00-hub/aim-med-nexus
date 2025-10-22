import React from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileEducationInfoProps = {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  institutionOptions: { value: string; label: string }[];
  onInstitutionSearch: (search: string) => void;
  isInstLoading: boolean;
  courseOptions: { value: string; label: string }[];
  onCourseSearch: (search: string) => void;
  isCourseLoading: boolean;
  studentYears: { value: string; label: string }[];
  userRole: string;
};

export const ProfileEducationInfo: React.FC<ProfileEducationInfoProps> = ({
  formData,
  onInputChange,
  institutionOptions,
  onInstitutionSearch,
  isInstLoading,
  courseOptions,
  onCourseSearch,
  isCourseLoading,
  studentYears,
  userRole
}) => {
  return (
    <div className="space-y-6">
      <div className="font-semibold text-lg">Educational Details</div>
      <div>
        <label className="block text-sm font-medium mb-2">Educational Institution *</label>
        <SearchableSelect
          options={institutionOptions}
          value={formData.institution_id}
          onValueChange={(v) => onInputChange('institution_id', v)}
          onSearchChange={onInstitutionSearch}
          isLoading={isInstLoading}
          placeholder="Select your institution"
          searchPlaceholder="Search institutions... (min 2 chars)"
          emptyMessage="No institution found."
        />
        {formData.institution_id === 'other' && (
          <Input className="mt-2" value={formData.institution_other} onChange={(e) => onInputChange('institution_other', e.target.value)} placeholder="Please specify institution" required />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Course/Program *</label>
          <SearchableSelect
            options={courseOptions}
            value={formData.course_id}
            onValueChange={(v) => onInputChange('course_id', v)}
            onSearchChange={onCourseSearch}
            isLoading={isCourseLoading}
            placeholder="Select your course"
            searchPlaceholder="Search courses... (min 2 chars)"
            emptyMessage="No course found."
          />
          {formData.course_id === 'other' && (
            <Input className="mt-2" value={formData.course_other} onChange={(e) => onInputChange('course_other', e.target.value)} placeholder="Please specify course" required />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year/Status (if student) {userRole === 'student' && '*'}</label>
          <Select value={formData.student_year_value} onValueChange={(v) => onInputChange('student_year_value', v)}>
            <SelectTrigger className="min-w-0"><SelectValue placeholder="Select your year of study" className="truncate"/></SelectTrigger>
            <SelectContent>
              {studentYears.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
