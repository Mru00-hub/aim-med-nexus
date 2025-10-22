import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";

// --- Import Refactored Components ---
import { ProfileAvatar } from '@/components/profile-edit/ProfileAvatar';
import { ProfileBasicInfo } from '@/components/profile-edit/ProfileBasicInfo';
import { ProfileProfessionalInfo } from '@/components/profile-edit/ProfileProfessionalInfo';
import { ProfileEducationInfo } from '@/components/profile-edit/ProfileEducationInfo';
import { ProfileAboutInfo } from '@/components/profile-edit/ProfileAboutInfo';

// --- Data Types ---
type Location = { id: string; label: string; value: string };
type Institution = { id: string; label: string; value: string };
type Course = { id: string; label: string; value: string };
type Specialization = { id: string; label: string; value: string };
type StudentYear = { value: string; label: string };
type ExperienceLevel = { value: string; label: string };

const generateUniqueColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = hash % 360;
  const saturation = 70 + (hash % 21);
  const lightness = 40 + (hash % 21);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// --- Helper function to add an item to a list only if it's not already there ---
function seedDropdownList<T extends { id: string }>(list: T[], item: T | null | undefined): T[] {
  if (!item) return list;
  if (list.find(i => i.id === item.id)) return list;
  return [item, ...list];
}

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [userRole, setUserRole] = useState(''); 

  // --- Form State ---
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    current_position: '',
    organization: '',
    bio: '',
    resume_url: '',
    skills: '',
    medical_license: '',
    location_id: '',
    location_other: '',
    institution_id: '',
    institution_other: '',
    course_id: '',
    course_other: '',
    specialization_id: '',
    specialization_other: '',
    student_year_value: '',
    experience_level_value: '',
  });

  // --- Dropdown Data States ---
  const [locations, setLocations] = useState<Location[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [studentYears, setStudentYears] = useState<StudentYear[]>([]);
  const [experiences, setExperiences] = useState<ExperienceLevel[]>([]);

  // --- Search States ---
  const [locationSearch, setLocationSearch] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");

  // --- Loading States ---
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [isInstLoading, setIsInstLoading] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // --- Fetch Location with Search (Debounced) ---
  useEffect(() => {
    setIsLocLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchLocations = async () => {
        if (locationSearch.length < 2) {
          setLocations(prev => prev.filter(l => l.id === formData.location_id)); // Keep selected
          setIsLocLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('locations')
          .select('id, label, value')
          .neq('value', 'other')
          .or(`label.ilike.%${locationSearch}%,value.ilike.%${locationSearch}%`)
          .order('label')
          .limit(50);
        
        if (data) {
          setLocations(prev => {
            const current = prev.find(l => l.id === formData.location_id);
            const newData = data.filter(l => l.id !== formData.location_id);
            return current ? [current, ...newData] : newData;
          });
        }
        if (error) console.error('Error fetching locations:', error);
        setIsLocLoading(false);
      };
      fetchLocations();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [locationSearch, formData.location_id]);

  // --- Fetch Institution with Search (Debounced) ---
  useEffect(() => {
    setIsInstLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchInstitutions = async () => {
        if (institutionSearch.length < 2) {
          setInstitutions(prev => prev.filter(i => i.id === formData.institution_id)); // Keep selected
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
        
        if (data) {
          setInstitutions(prev => {
            const current = prev.find(i => i.id === formData.institution_id);
            const newData = data.filter(i => i.id !== formData.institution_id);
            return current ? [current, ...newData] : newData;
          });
        }
        if (error) console.error('Error fetching institutions:', error);
        setIsInstLoading(false);
      };
      fetchInstitutions();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [institutionSearch, formData.institution_id]);

  // --- Fetch Course with Search (Debounced) ---
  useEffect(() => {
    setIsCourseLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchCourses = async () => {
        if (courseSearch.length < 2) {
          setCourses(prev => prev.filter(c => c.id === formData.course_id)); // Keep selected
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
        
        if (data) {
          setCourses(prev => {
            const current = prev.find(c => c.id === formData.course_id);
            const newData = data.filter(c => c.id !== formData.course_id);
            return current ? [current, ...newData] : newData;
          });
        }
        if (error) console.error('Error fetching courses:', error);
        setIsCourseLoading(false);
      };
      fetchCourses();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [courseSearch, formData.course_id]);

  // --- Fetch Specialization with Search (Debounced) ---
  useEffect(() => {
    setIsSpecLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchSpecializations = async () => {
        if (specializationSearch.length < 2) {
          setSpecializations(prev => prev.filter(s => s.id === formData.specialization_id)); // Keep selected
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
        
        if (data) {
          setSpecializations(prev => {
            const current = prev.find(s => s.id === formData.specialization_id);
            const newData = data.filter(s => s.id !== formData.specialization_id);
            return current ? [current, ...newData] : newData;
          });
        }
        if (error) console.error('Error fetching specializations:', error);
        setIsSpecLoading(false);
      };
      fetchSpecializations();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [specializationSearch, formData.specialization_id]);


  // --- Fetch Static Data (Student Years, Experience Levels) ---
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
  }, []);

  // --- Memoized Options ---
  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations]
  );
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

  // --- Fetch Profile Data ---
  useEffect(() => {
    if (!authLoading && user) {
      const fetchProfileData = async () => {
        setIsPageLoading(true);
        setError('');
        
        // --- THIS IS THE FIX ---
        // 1. Fetch the simple profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('📊 Profile data:', profile);
        console.log('❌ Profile error:', profileError);

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load your profile data.");
          setIsPageLoading(false);
          return;
        }

        if (profile) {
          // 2. Now, fetch the *labels* for the IDs we just got
          const [loc, inst, cour, spec] = await Promise.all([
            profile.location_id ? supabase.from('locations').select('id, label, value').eq('id', profile.location_id).single() : Promise.resolve({ data: null }),
            profile.institution_id ? supabase.from('institutions').select('id, label, value').eq('id', profile.institution_id).single() : Promise.resolve({ data: null }),
            profile.course_id ? supabase.from('courses').select('id, label, value').eq('id', profile.course_id).single() : Promise.resolve({ data: null }),
            profile.specialization_id ? supabase.from('specializations').select('id, label, value').eq('id', profile.specialization_id).single() : Promise.resolve({ data: null }),
          ]);

          // 3. Seed the dropdown states with the fetched items
          setLocations(prev => seedDropdownList(prev, loc.data));
          setInstitutions(prev => seedDropdownList(prev, inst.data));
          setCourses(prev => seedDropdownList(prev, cour.data));
          setSpecializations(prev => seedDropdownList(prev, spec.data));

          // 4. Set the user role
          setUserRole(profile.user_role || '');

          // 5. Set the form data (this logic was correct)
          const determineId = (id: string | null, other: string | null) => {
            if (id) return id;
            if (other) return 'other';
            return '';
          };
          const skillsString = Array.isArray(profile.skills) 
            ? profile.skills.join(', ') 
            : (profile.skills || '');

          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            date_of_birth: profile.date_of_birth || '',
            current_position: profile.current_position || '',
            organization: profile.organization || '',
            bio: profile.bio || '',
            resume_url: profile.resume_url || '',
            skills: skillsString,
            medical_license: profile.medical_license || '',
            location_id: determineId(profile.location_id, profile.location_other),
            location_other: profile.location_other || '',
            institution_id: determineId(profile.institution_id, profile.institution_other),
            institution_other: profile.institution_other || '',
            course_id: determineId(profile.course_id, profile.course_other),
            course_other: profile.course_other || '',
            specialization_id: determineId(profile.specialization_id, profile.specialization_other),
            specialization_other: profile.specialization_other || '',
            student_year_value: profile.student_year_value || '',
            experience_level_value: profile.experience_level_value || '',
          });

          // Set Avatar
          if (profile.profile_picture_url) {
            setAvatarUrl(profile.profile_picture_url);
          } else if (profile.full_name) {
            const uniqueColor = generateUniqueColor(user.id);
            const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile.full_name
            )}&background=${uniqueColor.substring(1)}&color=fff&size=256`;
            setAvatarUrl(generatedUrl);
          }
          setIsPageLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [user, authLoading]);
  // --- END OF FIX ---

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // --- Validation ---
    const requiredFields: { [key: string]: string } = {
      full_name: "Full Name",
      date_of_birth: "Date of Birth",
      location_id: "Location",
      institution_id: "Educational Institution",
      course_id: "Course/Program",
    };
    
    if (userRole === 'student') {
      requiredFields.student_year_value = "Year/Status";
    }
    
    if (userRole !== 'student') {
      requiredFields.current_position = "Current Position";
      requiredFields.organization = "Organization";
      requiredFields.specialization_id = "Specialization";
      requiredFields.experience_level_value = "Experience Level";
    }

    const missingFields: string[] = [];
    (Object.keys(requiredFields) as Array<keyof typeof formData>).forEach((field) => {
      if (!formData[field]) {
        if (field === 'location_id' && formData.location_other) return;
        if (field === 'institution_id' && formData.institution_other) return;
        if (field === 'course_id' && formData.course_other) return;
        if (field === 'specialization_id' && formData.specialization_other) return;

        missingFields.push(requiredFields[field]);
      }
    });

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in all required fields: ${missingFields.join(', ')}`;
      setError(errorMsg);
      toast({
        title: "Missing Information",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    // --- End Validation ---

    setIsSubmitting(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload new avatar
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = publicUrlData.publicUrl;
      }

      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

      // 2. Call update_profile RPC
      const rpcArgs = {
        p_full_name: formData.full_name,
        p_phone: formData.phone || null,
        p_date_of_birth: formData.date_of_birth || null,
        p_bio: formData.bio || null,
        p_current_position: formData.current_position || null,
        p_organization: formData.organization || null,
        p_skills: skillsArray,
        p_medical_license: formData.medical_license || null,
        p_location_id: formData.location_id === 'other' ? null : (formData.location_id || null),
        p_location_other: formData.location_id === 'other' ? formData.location_other : null,
        p_institution_id: formData.institution_id === 'other' ? null : (formData.institution_id || null),
        p_institution_other: formData.institution_id === 'other' ? formData.institution_other : null,
        p_course_id: formData.course_id === 'other' ? null : (formData.course_id || null),
        p_course_other: formData.course_id === 'other' ? formData.course_other : null,
        p_specialization_id: formData.specialization_id === 'other' ? null : (formData.specialization_id || null),
        p_specialization_other: formData.specialization_id === 'other' ? formData.specialization_other : null,
        p_student_year_value: formData.student_year_value || null,
        p_experience_level_value: formData.experience_level_value || null,
        p_resume_url: formData.resume_url || null,
        p_profile_picture_url: finalAvatarUrl,
        p_is_onboarded: true,
      };

      const { error: rpcError } = await supabase.rpc('update_profile', rpcArgs);
      if (rpcError) throw rpcError;

      toast({
        title: "Profile Saved!",
        description: "Your profile has been updated successfully.",
      });

      await refreshProfile();
      navigate('/community', { replace: true });

    } catch (err: any) {
      console.error("Error saving profile:", err);
      const errorMessage = `Failed to save profile: ${err.message}`;
      setError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const { error: skipError } = await supabase
      .from('profiles')
      .update({ is_onboarded: true })
      .eq('id', user.id);

    if (skipError) {
      toast({ title: "Error", description: "Could not process request. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    } else {
      await refreshProfile();
      navigate('/community', { replace: true });
    }
  };

  if (authLoading || isPageLoading) {
    return <PageSkeleton />;
  }

  if (error && !formData.full_name) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-medical flex items-center justify-center py-20 px-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">
              Edit Your Profile
            </CardTitle>
            <CardDescription>
              Keep your professional information up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileAvatar
              avatarPreview={avatarPreview}
              avatarUrl={avatarUrl}
              fullName={formData.full_name}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={removeAvatar}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <ProfileBasicInfo
                formData={formData}
                onInputChange={handleInputChange}
                locationOptions={locationOptions}
                onLocationSearch={setLocationSearch}
                isLocLoading={isLocLoading}
              />

              <Separator />

              {/* --- Conditional Rendering --- */}
              {userRole !== 'student' && (
                <>
                  <ProfileProfessionalInfo
                    formData={formData}
                    onInputChange={handleInputChange}
                    specializationOptions={specializationOptions}
                    onSpecializationSearch={setSpecializationSearch}
                    isSpecLoading={isSpecLoading}
                    experiences={experiences}
                  />
                  <Separator />
                </>
              )}

              <ProfileEducationInfo
                formData={formData}
                onInputChange={handleInputChange}
                institutionOptions={institutionOptions}
                onInstitutionSearch={setInstitutionSearch}
                isInstLoading={isInstLoading}
                courseOptions={courseOptions}
                onCourseSearch={setCourseSearch}
                isCourseLoading={isCourseLoading}
                studentYears={studentYears}
                userRole={userRole}
              />

              <Separator />

              <ProfileAboutInfo
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" size="lg" className="btn-medical w-full sm:flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                  <Save className="ml-2 h-5 w-5" />
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="py-12">
      <Card className="card-medical max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center mb-8 space-y-2">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </main>
    <Footer />
  </div>
);

export default CompleteProfile;
