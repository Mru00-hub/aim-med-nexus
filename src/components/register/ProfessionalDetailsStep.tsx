import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { institutions, courses, specializations, experiences, studentYears } from './_data'; // We'll create this file next

type ProfessionalDetailsStepProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  registrationType: string;
};

export const ProfessionalDetailsStep: React.FC<ProfessionalDetailsStepProps> = ({ formData, handleInputChange, registrationType }) => {
  return (
    <>
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-primary mb-2">Educational Background (Required)</h4>
        <p className="text-sm text-muted-foreground">
          All members must provide educational details to maintain our professional community standards.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Educational Institution *</label>
        <Select value={formData.institution} onValueChange={(value) => handleInputChange('institution', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your college/university" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {institutions.map(inst => <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {formData.institution === 'other' && (
          <div className="mt-2">
            <Input
              value={formData.otherInstitution}
              onChange={(e) => handleInputChange('otherInstitution', e.target.value)}
              placeholder="Please specify your institution"
              required
            />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Course/Program *</label>
          <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your course" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              {courses.map(course => <SelectItem key={course.value} value={course.value}>{course.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {formData.course === 'other' && (
            <div className="mt-2">
              <Input
                value={formData.otherCourse}
                onChange={(e) => handleInputChange('otherCourse', e.target.value)}
                placeholder="Please specify your course"
                required
              />
            </div>
          )}
        </div>
        {registrationType === 'student' && (
          <div>
            <label className="block text-sm font-medium mb-2">Year/Status *</label>
            <Select value={formData.yearOfStudy} onValueChange={(value) => handleInputChange('yearOfStudy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Current year/status" />
              </SelectTrigger>
              <SelectContent>
                {studentYears.map(year => <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {registrationType === 'professional' && (
        <>
          <div className="bg-muted/30 p-4 rounded-lg my-4">
            <h4 className="font-semibold text-primary mb-2">Professional Information</h4>
            <p className="text-sm text-muted-foreground">
              Details about your current role in the healthcare industry.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Position *</label>
              <Input 
                value={formData.currentPosition}
                onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                placeholder="e.g., Business Analyst"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Organization *</label>
              <Input 
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Company/Organization name"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Field/Domain *</label>
              <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your field" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {specializations.map(spec => <SelectItem key={spec.value} value={spec.value}>{spec.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {formData.specialization === 'other' && (
                <div className="mt-2">
                  <Input
                    value={formData.otherSpecialization}
                    onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                    placeholder="Please specify your specialization"
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Experience*</label>
              <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Years of experience" />
                </SelectTrigger>
                <SelectContent>
                  {experiences.map(exp => <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>)}
                </SelectContent>
               </Select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Professional Bio</label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Brief description of your professional background..."
              rows={3}
            />
          </div>
        </>
      )}

      <div className="space-y-4 pt-4">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-5">
            I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </label>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="updates"
            checked={formData.receiveUpdates}
            onCheckedChange={(checked) => handleInputChange('receiveUpdates', checked as boolean)}
          />
          <label htmlFor="updates" className="text-sm text-muted-foreground leading-5">
            I want to receive updates about new features and opportunities
          </label>
        </div>
      </div>
    </>
  );
};
