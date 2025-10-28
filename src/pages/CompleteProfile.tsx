import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, AlertCircle, Award, BookOpen, ShieldCheck, Briefcase, User, GraduationCap, PenTool, Lightbulb, HeartHandshake, Palette, Megaphone } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// --- Import ALL Profile Edit Components ---
import { ProfileAvatar } from '@/components/profile-edit/ProfileAvatar';
import { ProfileBasicInfo } from '@/components/profile-edit/ProfileBasicInfo';
import { ProfileProfessionalInfo } from '@/components/profile-edit/ProfileProfessionalInfo';
import { ProfileEducationInfo } from '@/components/profile-edit/ProfileEducationInfo';
import { ProfileAboutInfo } from '@/components/profile-edit/ProfileAboutInfo';
// 🚀 PLAN: Import new components
import { ProfileModeSelector } from '@/components/profile-edit/ProfileModeSelector';
import { ProfileAchievementsForm } from '@/components/profile-edit/ProfileAchievementsForm';
import { ProfilePublicationsForm } from '@/components/profile-edit/ProfilePublicationsForm';
import { ProfileCertificationsForm } from '@/components/profile-edit/ProfileCertificationsForm';
import { ProfileAwardsForm } from '@/components/profile-edit/ProfileAwardsForm';
import { ProfileTransitionInfo } from '@/components/profile-edit/ProfileTransitionInfo';
import { ProfileVenturesForm } from '@/components/profile-edit/ProfileVenturesForm';
import { ProfileContentForm } from '@/components/profile-edit/ProfileContentForm';
import { ProfileCocurricularsForm } from '@/components/profile-edit/ProfileCocurricularsForm';
import { ProfileWorkExperienceForm } from '@/components/profile-edit/ProfileWorkExperienceForm';
import { ProfileEducationHistoryForm } from '@/components/profile-edit/ProfileEducationHistoryForm';

// 🚀 PLAN: Import API functions and types from user.api.ts
import {
  getMyAcademicAchievements,
  getMyPublications,
  getMyCertifications,
  getMyAwards,
  getMyTransitionData,
  getMyVentures,
  getMyContentPortfolio,
  getMyCocurriculars,
  getMyWorkExperiences,
  getMyEducationHistory,
  saveProfileDetails,
  EditableAchievement,
  EditablePublication,
  EditableCertification,
  EditableAward,
  EditableTransition,
  EditableVenture,
  EditableContent,
  EditableCocurricular,
  EditableWorkExperience,
  EditableEducationHistory,
} from '@/integrations/supabase/user.api';

export type WorkExperienceItem = EditableWorkExperience;
export type EducationHistoryItem = EditableEducationHistory;

// --- Data Types ---
type Location = { id: string; label: string; value: string };
type Institution = { id: string; label: string; value: string };
type Course = { id: string; label: string; value: string };
type Specialization = { id: string; label: string; value: string };
type StudentYear = { value: string; label: string };
type ExperienceLevel = { value: string; label: string };

// --- (generateUniqueColor and seedDropdownList helpers remain the same) ---
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
function seedDropdownList<T extends { id: string }>(list: T[], item: T | null | undefined): T[] {
  if (!item) return list;
  if (list.find(i => i.id === item.id)) return list;
  return [item, ...list];
}
// ---

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
  
  // 🚀 PLAN: State for profile mode
  const [profileMode, setProfileMode] = useState<'clinical' | 'non_clinical'>('clinical');

  // --- Form State (Base) ---
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

  // 🚀 PLAN: State for all 1-to-many data
  // Clinical
  const [achievements, setAchievements] = useState<EditableAchievement[]>([]);
  const [publications, setPublications] = useState<EditablePublication[]>([]);
  const [certifications, setCertifications] = useState<EditableCertification[]>([]);
  const [awards, setAwards] = useState<EditableAward[]>([]);
  // Non-Clinical
  const [transitionData, setTransitionData] = useState<EditableTransition | null>(null);
  const [ventures, setVentures] = useState<EditableVenture[]>([]);
  const [contentPortfolio, setContentPortfolio] = useState<EditableContent[]>([]);
  // Shared
  const [cocurriculars, setCocurriculars] = useState<EditableCocurricular[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperienceItem[]>([]);
  const [educationHistory, setEducationHistory] = useState<EducationHistoryItem[]>([]);

  // 🚀 PLAN: State to track deleted items
  const [deletedItems, setDeletedItems] = useState({
    academic_achievements: [] as string[],
    publications: [] as string[],
    certifications: [] as string[],
    awards: [] as string[],
    ventures: [] as string[],
    content_portfolio: [] as string[],
    cocurriculars: [] as string[],
    work_experiences: [] as string[],
    education_history: [] as string[],
  });

  // --- (Dropdown, Search, and Loading states remain the same) ---
  const [locations, setLocations] = useState<Location[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [studentYears, setStudentYears] = useState<StudentYear[]>([]);
  const [experiences, setExperiences] = useState<ExperienceLevel[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [isInstLoading, setIsInstLoading] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

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
        
        // 1. Fetch the main profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load your profile data.");
          setIsPageLoading(false);
          return;
        }

        if (profile) {
          // 2. Fetch all related data in parallel using API functions
          const [
            loc, inst, cour, spec, // Dropdowns
            achievementsData, pubData, certData, awardData, // Clinical
            transData, ventureData, contentData, cocurricularData, workData, eduData // Non-Clinical + Shared
          ] = await Promise.all([
            // Dropdowns
            profile.location_id ? supabase.from('locations').select('id, label, value').eq('id', profile.location_id).single() : Promise.resolve({ data: null }),
            profile.institution_id ? supabase.from('institutions').select('id, label, value').eq('id', profile.institution_id).single() : Promise.resolve({ data: null }),
            profile.course_id ? supabase.from('courses').select('id, label, value').eq('id', profile.course_id).single() : Promise.resolve({ data: null }),
            profile.specialization_id ? supabase.from('specializations').select('id, label, value').eq('id', profile.specialization_id).single() : Promise.resolve({ data: null }),
            // API calls
            getMyAcademicAchievements(),
            getMyPublications(),
            getMyCertifications(),
            getMyAwards(),
            getMyTransitionData(),
            getMyVentures(),
            getMyContentPortfolio(),
            getMyCocurriculars(),
            getMyWorkExperiences(),
            getMyEducationHistory(),
          ]);

          // 3. Seed dropdowns
          setLocations(prev => seedDropdownList(prev, loc.data));
          setInstitutions(prev => seedDropdownList(prev, inst.data));
          setCourses(prev => seedDropdownList(prev, cour.data));
          setSpecializations(prev => seedDropdownList(prev, spec.data));

          // 4. Set main form states
          setUserRole(profile.user_role || '');
          setProfileMode(profile.profile_mode === 'non_clinical' ? 'non_clinical' : 'clinical');
          
          const determineId = (id: string | null, other: string | null) => (id ? id : other ? 'other' : '');
          const skillsString = Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '');
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

          // 5. Set 1-to-many form states
          setAchievements(achievementsData || []);
          setPublications(pubData.map(p => ({...p, authors: p.authors || []})) as any || []);
          setCertifications(certData || []);
          setAwards(awardData || []);
          setTransitionData(transData || { profile_id: user.id }); // Initialize if null
          setVentures(ventureData || []);
          setContentPortfolio(contentData || []);
          setCocurriculars(cocurricularData || []);
          setWorkExperience(workData || []);
          setEducationHistory(eduData || []);

          // 6. Set Avatar
          if (profile.profile_picture_url) {
            setAvatarUrl(profile.profile_picture_url);
          } else if (profile.full_name) {
            const uniqueColor = generateUniqueColor(user.id);
            const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=${uniqueColor.substring(1)}&color=fff&size=256`;
            setAvatarUrl(generatedUrl);
          }
          setIsPageLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [user, authLoading]);
  // --- END OF FETCH ---

  // --- Input Handlers ---

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleProfileModeChange = (mode: 'clinical' | 'non_clinical') => {
    setProfileMode(mode);
  };
  
  // 🚀 PLAN: Handler for the single transitionData object
  const handleTransitionChange = (field: string, value: any) => {
    setTransitionData(prev => ({
      ...(prev || { profile_id: user?.id }),
      [field]: value
    }) as EditableTransition);
  };

  // 🚀 PLAN: Generic handlers for all 1-to-many lists
  type ListNameExisting = 'achievements' | 'publications' | 'certifications' | 'awards' | 'ventures' | 'contentPortfolio' | 'cocurriculars';

  const handleListChange = (
    listName: ListName,
    index: number,
    field: string,
    value: any
  ) => {
    const setters = {
      achievements: setAchievements,
      publications: setPublications,
      certifications: setCertifications,
      awards: setAwards,
      ventures: setVentures,
      contentPortfolio: setContentPortfolio,
      cocurriculars: setCocurriculars,
    };
    const setter = setters[listName] as React.Dispatch<React.SetStateAction<any[]>>;
    
    setter(prev => {
      const newList = [...prev];
      let finalValue = value;
      // Handle array fields
      if ((listName === 'publications' && field === 'authors') || (listName === 'ventures' && field === 'achievements')) {
        finalValue = value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      newList[index] = { ...newList[index], [field]: finalValue };
      return newList;
    });
  };

  const addListItem = (listName: ListName) => {
    const defaults = {
      achievements: { exam_name: '', rank: '', percentile: null, year: null },
      publications: { type: 'journal', title: '', authors: [] },
      certifications: { certification_name: '', issuing_org: '', issue_date: '' },
      awards: { type: 'professional', award_name: '', issuing_org: '', date: '' },
      ventures: { name: '', venture_type: 'business', role: '' },
      contentPortfolio: { title: '', content_type: 'blog', url: '' },
      cocurriculars: { title: '', category: 'Organizational' },
    };
    const setters = {
      achievements: setAchievements,
      publications: setPublications,
      certifications: setCertifications,
      awards: setAwards,
      ventures: setVentures,
      contentPortfolio: setContentPortfolio,
      cocurriculars: setCocurriculars,
    };
    setters[listName]((prev: any[]) => [...prev, defaults[listName]]);
  };

  const handleWorkExperienceChange = (index: number, field: string, value: any) => {
    setWorkExperience(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };
  const addWorkExperience = () => {
    setWorkExperience(prev => [...prev, { position: '', organization: '', start_date: '', end_date: null, description: '' }]);
  };

  const handleEducationHistoryChange = (index: number, field: string, value: any) => {
    setEducationHistory(prev => {
      const newList = [...prev];
      // Clear associated 'other' field if a dropdown ID is selected
      if (field === 'institution_id' && value !== 'other') {
          newList[index] = { ...newList[index], [field]: value, institution_name: '' };
      } else if (field === 'course_id' && value !== 'other') { // Example if using course_id
          newList[index] = { ...newList[index], [field]: value, field_of_study: '' };
      } else {
         newList[index] = { ...newList[index], [field]: value };
      }
      return newList;
    });
  };
   const addEducationHistory = () => {
    setEducationHistory(prev => [...prev, { institution_name: '', degree: '', field_of_study: '', start_year: null, end_year: null, description: '' }]);
  };

  type AllListNames = ListNameExisting | 'work_experiences' | 'education_history';

  const removeListItem = (listName: AllListNames, index: number) => {
    const lists = {
      achievements, publications, certifications, awards, ventures, contentPortfolio, cocurriculars,
      work_experiences: workExperience, // Use snake_case for consistency with deletedItems keys
      education_history: educationHistory
    };
    const setters = {
      achievements: setAchievements,
      publications: setPublications,
      certifications: setCertifications,
      awards: setAwards,
      ventures: setVentures,
      contentPortfolio: setContentPortfolio,
      cocurriculars: setCocurriculars,
      work_experiences: setWorkExperience,
      education_history: setEducationHistory
    };
    
    const list = lists[listName];
    const setter = setters[listName];
    const item = list[index];
    if (item.id) {
      setDeletedItems(prev => ({
        ...prev,
        [listName]: [...prev[listName], item.id],
      }));
    }
    setters[listName]((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  // --- (Avatar Handlers remain the same) ---
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

      // 2. Call update_profile RPC (NOW INCLUDES profile_mode)
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
        p_profile_mode: profileMode, // 🚀 PLAN: Save the profile mode
      };
      
      const { error: rpcError } = await supabase.rpc('update_profile', rpcArgs);
      if (rpcError) throw rpcError;

      // 3. 🚀 PLAN: Call saveProfileDetails for all 1-to-many tables
      await saveProfileDetails(
        { // Payload
          achievements,
          publications,
          certifications,
          awards,
          transitionData,
          ventures,
          contentPortfolio,
          cocurriculars,
          workExperiences: workExperience,
          educationHistory: educationHistory,
        },
        deletedItems // Deleted items
      );

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
      <main className="py-8 sm:py-12">
        <Card className="card-medical max-w-2xl mx-auto p-0 sm:p-4 md:p-6">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">
              Edit Your Profile
            </CardTitle>
            <CardDescription>
              Showcase your complete professional identity.
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

              {/* --- Always-Visible Sections --- */}
              <ProfileBasicInfo
                formData={formData}
                onInputChange={handleInputChange}
                locationOptions={locationOptions}
                onLocationSearch={setLocationSearch}
                isLocLoading={isLocLoading}
              />
              <Separator />
              <ProfileModeSelector
                profileMode={profileMode}
                onModeChange={handleProfileModeChange}
              />
              <Separator />

              {/* --- Conditional Form Sections --- */}

              {profileMode === 'clinical' && userRole !== 'student' && (
                 <Accordion type="single" collapsible defaultValue="clinical-current-professional">
                    <AccordionItem value="clinical-current-professional">
                       <AccordionTrigger className="text-lg font-semibold">
                         <div className="flex items-center gap-2"> <Briefcase/> Current Professional Details </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-4">
                         <ProfileProfessionalInfo />
                       </AccordionContent>
                    </AccordionItem>
                 </Accordion>
              )}
               <Separator />

              {/* --- CURRENT Education Info --- */}
              <Accordion type="single" collapsible defaultValue="current-education">
                 <AccordionItem value="current-education">
                   <AccordionTrigger className="text-lg font-semibold">
                     <div className="flex items-center gap-2"> <GraduationCap/> Current Educational Details </div>
                   </AccordionTrigger>
                   <AccordionContent className="pt-4">
                     <ProfileEducationInfo />
                   </AccordionContent>
                 </AccordionItem>
              </Accordion>
              <Separator />

              {/* --- ADDED: REPEATABLE Work Experience --- */}
              <Accordion type="multiple" collapsible className="w-full space-y-4"> {/* Changed to multiple */}
                <AccordionItem value="work-history">
                    <AccordionTrigger className="text-lg font-semibold">
                       <div className="flex items-center gap-2"> <Briefcase/> Work Experience History </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ProfileWorkExperienceForm
                         items={workExperience}
                         onListChange={handleWorkExperienceChange} // Use specific handler
                         onAddItem={addWorkExperience}           // Use specific handler
                         onRemoveItem={(index) => removeListItem('work_experiences', index)} // Use generic remove handler
                       />
                    </AccordionContent>
                </AccordionItem>

              {/* --- ADDED: REPEATABLE Education History --- */}
                <AccordionItem value="education-history">
                    <AccordionTrigger className="text-lg font-semibold">
                       <div className="flex items-center gap-2"> <GraduationCap/> Education History </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ProfileEducationHistoryForm
                         items={educationHistory}
                         onListChange={handleEducationHistoryChange} // Use specific handler
                         onAddItem={addEducationHistory}           // Use specific handler
                         onRemoveItem={(index) => removeListItem('education_history', index)} // Use generic remove handler
                         // Pass dropdown props needed by the component
                         institutionOptions={institutionOptions}
                         onInstitutionSearch={setInstitutionSearch}
                         isInstLoading={isInstLoading}
                         courseOptions={courseOptions}
                         onCourseSearch={setCourseSearch}
                         isCourseLoading={isCourseLoading}
                       />
                    </AccordionContent>
                </AccordionItem>
              
              {/* 🚀 PLAN: Clinical Profile Forms */}
              {profileMode === 'clinical' && (
                <Accordion type="multiple" collapsible className="w-full space-y-4">
                  
                  {userRole !== 'student' && (
                    <AccordionItem value="clinical-professional">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Professional Details
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ProfileProfessionalInfo
                          formData={formData}
                          onInputChange={handleInputChange}
                          specializationOptions={specializationOptions}
                          onSpecializationSearch={setSpecializationSearch}
                          isSpecLoading={isSpecLoading}
                          experiences={experiences}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="clinical-education">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Educational Details
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
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
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="clinical-achievements">
                    <AccordionTrigger className="text-lg font-semibold">
                       <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Academic Achievements
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileAchievementsForm items={achievements} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="clinical-publications">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Research & Publications
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfilePublicationsForm items={publications} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="clinical-certs">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Certifications
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileCertificationsForm items={certifications} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="clinical-awards">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Awards & Honors
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileAwardsForm items={awards} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              )}

              {/* 🚀 PLAN: Non-Clinical Profile Forms */}
              {profileMode === 'non_clinical' && (
                <Accordion type="multiple" collapsible className="w-full space-y-4">
                  <AccordionItem value="nonclinical-transition">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="h-5 w-5 text-primary" />
                        My Transition Journey
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileTransitionInfo formData={transitionData || { profile_id: user.id }} onTransitionChange={handleTransitionChange} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="nonclinical-ventures">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Ventures & Projects
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileVenturesForm items={ventures} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="nonclinical-content">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        Content Portfolio
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ProfileContentForm items={contentPortfolio} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="nonclinical-clinical-bg">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Clinical Background (Foundation)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-6">
                      <ProfileProfessionalInfo
                        formData={formData}
                        onInputChange={handleInputChange}
                        specializationOptions={specializationOptions}
                        onSpecializationSearch={setSpecializationSearch}
                        isSpecLoading={isSpecLoading}
                        experiences={experiences}
                      />
                      <Separator />
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* --- Shared Sections --- */}
              <Separator />
              <Accordion type="multiple" collapsible className="w-full space-y-4">
                <AccordionItem value="shared-cocurriculars">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Cocurriculars & Organizing
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ProfileCocurricularsForm items={cocurriculars} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={removeListItem} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shared-about">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      About & Links
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <ProfileAboutInfo
                      formData={formData}
                      onInputChange={handleInputChange}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {/* --- Form Actions --- */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
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

// --- (PageSkeleton remains the same) ---
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
