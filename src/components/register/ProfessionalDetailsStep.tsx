//src/components/register/ProfessionalDetailsStep.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';

type Institution = { id: string; label: string; };
type Course = { id: string; label: string; };
type Specialization = { id: string; label: string; };
type StudentYear = { value: string; label: string; };
type ExperienceLevel = { value: string; label: string; };
 
type ProfessionalDetailsStepProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
  registrationType: string;
};

export const ProfessionalDetailsStep: React.FC<ProfessionalDetailsStepProps> = ({ formData, handleInputChange, registrationType }) => {
  // Data states
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [studentYears, setStudentYears] = useState<StudentYear[]>([]);
  const [experiences, setExperiences] = useState<ExperienceLevel[]>([]);

  // Search term states
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");

  // Loading states
  const [isInstLoading, setIsInstLoading] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [isSpecLoading, setIsSpecLoading] = useState(false);

  // --- Data Fetching Effects ---

  // Effect for Institution search (debounced)
  useEffect(() => {
    setIsInstLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchInstitutions = async () => {
        if (institutionSearch.length < 2) {
          setInstitutions([]);
          setIsInstLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('institutions')
          .select('id, label, value')
          .neq('value', 'other')
          .or(`label.ilike.%${institutionSearch}%,value.ilike.%${institutionSearch}%`)
          .order('label')
          .limit(50);
        
        if (data) setInstitutions(data);
        if (error) console.error('Error fetching institutions:', error);
        setIsInstLoading(false);
      };
      fetchInstitutions();
    }, 500); // 500ms debounce
    return () => clearTimeout(searchTimer);
  }, [institutionSearch]);

  // Effect for Course search (debounced)
  useEffect(() => {
    setIsCourseLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchCourses = async () => {
        if (courseSearch.length < 2) {
          setCourses([]);
          setIsCourseLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('courses')
          .select('id, label, value')
          .neq('value', 'other')
          .or(`label.ilike.%${courseSearch}%,value.ilike.%${courseSearch}%`)
          .order('label')
          .limit(50);
        
        if (data) setCourses(data);
        if (error) console.error('Error fetching courses:', error);
        setIsCourseLoading(false);
      };
      fetchCourses();
    }, 500); // 500ms debounce
    return () => clearTimeout(searchTimer);
  }, [courseSearch]);

  // Effect for Specialization search (debounced)
  useEffect(() => {
    setIsSpecLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchSpecializations = async () => {
        if (specializationSearch.length < 2) {
          setSpecializations([]);
          setIsSpecLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('specializations')
          .select('id, label, value')
          .neq('value', 'other')
          .or(`label.ilike.%${specializationSearch}%,value.ilike.%${specializationSearch}%`)
          .order('label')
          .limit(50);
        
        if (data) setSpecializations(data);
        if (error) console.error('Error fetching specializations:', error);
        setIsSpecLoading(false);
      };
      fetchSpecializations();
    }, 500); // 500ms debounce
    return () => clearTimeout(searchTimer);
  }, [specializationSearch]);

  // Effect for static (non-searchable) data
  useEffect(() => {
    const fetchStaticData = async () => {
      const [yearRes, expRes] = await Promise.all([
        supabase.from('student_years').select('value, label').order('sort_order'),
        supabase.from('experience_levels').select('value, label').order('sort_order')
      ]);
      if (yearRes.data) setStudentYears(yearRes.data);
      if (expRes.data) setExperiences(expRes.data);
    };
    fetchStaticData();
  }, []); // Runs once on mount

  // --- Memoized Options ---

  const institutionOptions = useMemo(() => 
    institutions.map(inst => ({ value: inst.id, label: inst.label })),
    [institutions]
  );
  const courseOptions = useMemo(() =>
    courses.map(course => ({ value: course.id, label: course.label })),
    [courses]
  );
  const specializationOptions = useMemo(() =>
    specializations.map(spec => ({ value: spec.id, label: spec.label })),
    [specializations]
  );
  
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
        <SearchableSelect
          options={institutionOptions}
          value={formData.institution_id}
          onValueChange={(value) => handleInputChange('institution_id', value)}
          onSearchChange={setInstitutionSearch}
          isLoading={isInstLoading}
          placeholder="Select your college/university"
          searchPlaceholder="Search institutions... (min 2 chars)"
          emptyMessage="No institution found."
        />
        {formData.institution_id === 'other' && (
          <div className="mt-2">
            <Input
              value={formData.institution_other}
              onChange={(e) => handleInputChange('institution_other', e.target.value)}
              placeholder="Please specify your institution"
              required
            />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Course/Program *</label>
          <SearchableSelect
            options={courseOptions}
            value={formData.course_id}
            onValueChange={(value) => handleInputChange('course_id', value)}
            onSearchChange={setCourseSearch}
            isLoading={isCourseLoading}
            placeholder="Select your course"
            searchPlaceholder="Search courses... (min 2 chars)"
            emptyMessage="No course found."
          />
          {formData.course_id === 'other' && (
            <div className="mt-2">
              <Input
                value={formData.course_other}
                onChange={(e) => handleInputChange('course_other', e.target.value)}
                placeholder="Please specify your course"
                required
              />
            </div>
          )}
        </div>
        {registrationType === 'student' && (
          <div>
            <label className="block text-sm font-medium mb-2">Year/Status *</label>
            <Select value={formData.student_year_value} onValueChange={(value) => handleInputChange('student_year_value', value)}>
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
              <label className="block text-sm font-medium mb-2"> Industry Field/Domain *</label>
              <SearchableSelect
                options={specializationOptions}
                value={formData.specialization_id}
                onValueChange={(value) => handleInputChange('specialization_id', value)}
                onSearchChange={setSpecializationSearch}
                isLoading={isSpecLoading}
                placeholder="Select your field"
                searchPlaceholder="Search specializations... (min 2 chars)"
                emptyMessage="No specialization found."
              />
              {formData.specialization_id === 'other' && (
                <div className="mt-2">
                  <Input
                    value={formData.specialization_other}
                    onChange={(e) => handleInputChange('specialization_other', e.target.value)}
                    placeholder="Please specify your specialization"
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Experience*</label>
              <Select value={formData.experience_level_value} onValueChange={(value) => handleInputChange('experience_level_value', value)}>
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
