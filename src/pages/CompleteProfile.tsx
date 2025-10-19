import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, AlertCircle, Upload, CircleX } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
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

  // --- Fetch Location with Search ---
  useEffect(() => {
    setIsLocLoading(true);
    const searchTimer = setTimeout(() => {
      const fetchLocations = async () => {
        if (locationSearch.length < 2) {
          setLocations([]);
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
        
        if (data) setLocations(data);
        if (error) console.error('Error fetching locations:', error);
        setIsLocLoading(false);
      };
      fetchLocations();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [locationSearch]);

  // --- Fetch Institution with Search ---
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
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [institutionSearch]);

  // --- Fetch Course with Search ---
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
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [courseSearch]);

  // --- Fetch Specialization with Search ---
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
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [specializationSearch]);

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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('📊 Profile data:', data); // ✅ ADD
        console.log('❌ Profile error:', error); // ✅ ADD

        if (error) {
          console.error("Error fetching profile:", error);
          setError("Could not load your profile data.");
          return;
        }

        if (data) {
          console.log('✅ Setting form data...');
          // ✅ FIXED: Properly determine if "other" should be selected
          const determineLocationId = () => {
            if (data.location_id) return data.location_id;
            if (data.location_other) return 'other';
            return '';
          };

          const determineInstitutionId = () => {
            if (data.institution_id) return data.institution_id;
            if (data.institution_other) return 'other';
            return '';
          };

          const determineCourseId = () => {
            if (data.course_id) return data.course_id;
            if (data.course_other) return 'other';
            return '';
          };

          const determineSpecializationId = () => {
            if (data.specialization_id) return data.specialization_id;
            if (data.specialization_other) return 'other';
            return '';
          };

          // ✅ FIXED: Handle skills properly (can be array, string, or null)
          const skillsString = Array.isArray(data.skills) 
            ? data.skills.join(', ') 
            : (data.skills || '');

          setFormData({
            full_name: data.full_name || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            current_position: data.current_position || '',
            organization: data.organization || '',
            bio: data.bio || '',
            resume_url: data.resume_url || '',
            skills: skillsString,
            medical_license: data.medical_license || '',
            location_id: determineLocationId(),
            location_other: data.location_other || '',
            institution_id: determineInstitutionId(),
            institution_other: data.institution_other || '',
            course_id: determineCourseId(),
            course_other: data.course_other || '',
            specialization_id: determineSpecializationId(),
            specialization_other: data.specialization_other || '',
            student_year_value: data.student_year_value || '',
            experience_level_value: data.experience_level_value || '',
          });

          // Set Avatar
          if (data.profile_picture_url) {
            setAvatarUrl(data.profile_picture_url);
          } else if (data.full_name) {
            const uniqueColor = generateUniqueColor(user.id);
            const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              data.full_name
            )}&background=${uniqueColor.substring(1)}&color=fff&size=256`;
            setAvatarUrl(generatedUrl);
          }
        }
      };
      fetchProfileData();
    }
  }, [user, authLoading]);

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
    setIsSubmitting(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload new avatar if selected
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
      };

      const { error: rpcError } = await supabase.rpc('update_profile', rpcArgs);
      if (rpcError) throw rpcError;

      // 3. Update avatar, resume, onboarding status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_url: formData.resume_url || null,
          profile_picture_url: finalAvatarUrl,
          is_onboarded: true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.warn("RPC succeeded, but profile update failed:", updateError.message);
      }

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

  if (authLoading) {
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
      <main className="container-medical py-12 px-4 sm:px-6">
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
            <div className="flex flex-col items-center mb-8 gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary/20">
                  <AvatarImage 
                    src={avatarPreview || avatarUrl} 
                    alt={formData.full_name} 
                    className="object-cover" 
                  />
                  <AvatarFallback>{formData.full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <button type="button" onClick={removeAvatar} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80">
                    <CircleX className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button asChild variant="outline">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" /> Change Picture
                  <input id="avatar-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleAvatarChange} />
                </label>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="font-semibold text-lg">Basic Information</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <SearchableSelect
                    options={locationOptions}
                    value={formData.location_id}
                    onValueChange={(v) => handleInputChange('location_id', v)}
                    onSearchChange={setLocationSearch}
                    isLoading={isLocLoading}
                    placeholder="Select your location"
                    searchPlaceholder="Search locations... (min 2 chars)"
                    emptyMessage="No location found."
                  />
                  {formData.location_id === 'other' && (
                    <Input className="mt-2" value={formData.location_other} onChange={(e) => handleInputChange('location_other', e.target.value)} placeholder="Please specify location" />
                  )}
                </div>
              </div>

              <Separator />
              <div className="font-semibold text-lg">Professional Details</div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Position</label>
                  <Input value={formData.current_position} onChange={(e) => handleInputChange('current_position', e.target.value)} placeholder="e.g., Resident Doctor" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Organization</label>
                  <Input value={formData.organization} onChange={(e) => handleInputChange('organization', e.target.value)} placeholder="e.g., City Hospital" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Field/Domain (Specialization)</label>
                <SearchableSelect
                  options={specializationOptions}
                  value={formData.specialization_id}
                  onValueChange={(v) => handleInputChange('specialization_id', v)}
                  onSearchChange={setSpecializationSearch}
                  isLoading={isSpecLoading}
                  placeholder="Select your specialization"
                  searchPlaceholder="Search specializations... (min 2 chars)"
                  emptyMessage="No specialization found."
                />
                {formData.specialization_id === 'other' && (
                  <Input className="mt-2" value={formData.specialization_other} onChange={(e) => handleInputChange('specialization_other', e.target.value)} placeholder="Please specify specialization" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <Select value={formData.experience_level_value} onValueChange={(v) => handleInputChange('experience_level_value', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your experience" /></SelectTrigger>
                  <SelectContent>
                    {experiences.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Medical License</label>
                <Input value={formData.medical_license} onChange={(e) => handleInputChange('medical_license', e.target.value)} placeholder="Your license number (if applicable)" />
              </div>

              <Separator />
              <div className="font-semibold text-lg">Educational Details</div>

              <div>
                <label className="block text-sm font-medium mb-2">Educational Institution</label>
                <SearchableSelect
                  options={institutionOptions}
                  value={formData.institution_id}
                  onValueChange={(v) => handleInputChange('institution_id', v)}
                  onSearchChange={setInstitutionSearch}
                  isLoading={isInstLoading}
                  placeholder="Select your institution"
                  searchPlaceholder="Search institutions... (min 2 chars)"
                  emptyMessage="No institution found."
                />
                {formData.institution_id === 'other' && (
                  <Input className="mt-2" value={formData.institution_other} onChange={(e) => handleInputChange('institution_other', e.target.value)} placeholder="Please specify institution" />
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course/Program</label>
                  <SearchableSelect
                    options={courseOptions}
                    value={formData.course_id}
                    onValueChange={(v) => handleInputChange('course_id', v)}
                    onSearchChange={setCourseSearch}
                    isLoading={isCourseLoading}
                    placeholder="Select your course"
                    searchPlaceholder="Search courses... (min 2 chars)"
                    emptyMessage="No course found."
                  />
                  {formData.course_id === 'other' && (
                    <Input className="mt-2" value={formData.course_other} onChange={(e) => handleInputChange('course_other', e.target.value)} placeholder="Please specify course" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year/Status (if student)</label>
                  <Select value={formData.student_year_value} onValueChange={(v) => handleInputChange('student_year_value', v)}>
                    <SelectTrigger><SelectValue placeholder="Select your year of study" /></SelectTrigger>
                    <SelectContent>
                      {studentYears.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <div className="font-semibold text-lg">About & Links</div>

              <div>
                <label className="block text-sm font-medium mb-2">Professional Bio</label>
                <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="A brief summary..." rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                <Textarea value={formData.skills} onChange={(e) => handleInputChange('skills', e.target.value)} placeholder="e.g., Cardiology, Python" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Resume/CV URL</label>
                <Input type="url" value={formData.resume_url} onChange={(e) => handleInputChange('resume_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" size="lg" className="btn-medical flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                  <Save className="ml-2 h-5 w-5" />
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSkip}
                  disabled={isSubmitting}
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
    <main className="container-medical py-12 px-4 sm:px-6">
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
