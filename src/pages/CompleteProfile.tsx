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
import { generateAvatarUrl } from '@/lib/utils';
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
import { useQueryClient } from '@tanstack/react-query'; 
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
  const queryClient = useQueryClient();
  
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
  const DRAFT_KEY = useMemo(() => `profile-draft-${user?.id}`, [user?.id]);

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

  useEffect(() => {
    // Don't save while loading or if user isn't set
    if (isPageLoading || authLoading || !user) {
      return;
    }

    try {
      const draftData = {
        formData,
        profileMode,
        userRole, // Save userRole
        achievements,
        publications,
        certifications,
        awards,
        transitionData,
        ventures,
        contentPortfolio,
        cocurriculars,
        workExperience,
        educationHistory,
        deletedItems,
        avatarUrl // Save avatar URL
      };
  
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (error) {
      console.warn("Failed to save profile draft:", error);
    }
    
  }, [
    formData, profileMode, userRole, achievements, publications, certifications, awards, 
    transitionData, ventures, contentPortfolio, cocurriculars, workExperience, 
    educationHistory, deletedItems, avatarUrl, isPageLoading, authLoading, user, DRAFT_KEY
  ]);

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
      const savedDraft = localStorage.getItem(DRAFT_KEY);
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
            const generatedUrl = generateAvatarUrl(profile.full_name, user.id);
            setAvatarUrl(generatedUrl);
          }
          setIsPageLoading(false);
        }
      };
      const loadDraftData = async () => {
        setIsPageLoading(true);
        try {
          const draft = JSON.parse(savedDraft!);
          
          // 1. Restore all states from draft
          setFormData(draft.formData);
          setProfileMode(draft.profileMode);
          setUserRole(draft.userRole); // Restore role
          setAchievements(draft.achievements || []);
          setPublications(draft.publications.map((p: any) => ({...p, authors: p.authors || []})) || []);
          setCertifications(draft.certifications || []);
          setAwards(draft.awards || []);
          setTransitionData(draft.transitionData || { profile_id: user.id });
          setVentures(draft.ventures || []);
          setContentPortfolio(draft.contentPortfolio || []);
          setCocurriculars(draft.cocurriculars || []);
          setWorkExperience(draft.workExperience || []);
          setEducationHistory(draft.educationHistory || []);
          setDeletedItems(draft.deletedItems || { /* ... initial empty object ... */ });
          setAvatarUrl(draft.avatarUrl || '');

          // 2. Fetch dropdown labels based on draft's formData
          const [loc, inst, cour, spec] = await Promise.all([
            draft.formData.location_id && draft.formData.location_id !== 'other' ? supabase.from('locations').select('id, label, value').eq('id', draft.formData.location_id).single() : Promise.resolve({ data: null }),
            draft.formData.institution_id && draft.formData.institution_id !== 'other' ? supabase.from('institutions').select('id, label, value').eq('id', draft.formData.institution_id).single() : Promise.resolve({ data: null }),
            draft.formData.course_id && draft.formData.course_id !== 'other' ? supabase.from('courses').select('id, label, value').eq('id', draft.formData.course_id).single() : Promise.resolve({ data: null }),
            draft.formData.specialization_id && draft.formData.specialization_id !== 'other' ? supabase.from('specializations').select('id, label, value').eq('id', draft.formData.specialization_id).single() : Promise.resolve({ data: null }),
          ]);

          // 3. Seed dropdowns
          setLocations(prev => seedDropdownList(prev, loc.data));
          setInstitutions(prev => seedDropdownList(prev, inst.data));
          setCourses(prev => seedDropdownList(prev, cour.data));
          setSpecializations(prev => seedDropdownList(prev, spec.data));

          setIsPageLoading(false);
          toast({ title: "Draft Restored", description: "Your unsaved changes have been loaded." });
        } catch (e) {
          console.error("Failed to load draft, fetching from server:", e);
          localStorage.removeItem(DRAFT_KEY); // Clear bad draft
          fetchProfileData(); // Fallback to normal fetch
        }
      };

      // --- MODIFICATION: Logic to decide whether to load draft or fetch ---
      if (savedDraft) {
        loadDraftData();
      } else {
        fetchProfileData();
      }
    }
  }, [user, authLoading, DRAFT_KEY, toast]);
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
    listName: ListNameExisting,
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

  const addListItem = (listName: ListNameExisting) => {
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
    const lists = { achievements, publications, certifications, awards, ventures, contentPortfolio, cocurriculars, work_experiences: workExperience, education_history: educationHistory }; // 
    const setters = { achievements: setAchievements, publications: setPublications, certifications: setCertifications, awards: setAwards, ventures: setVentures, contentPortfolio: setContentPortfolio, cocurriculars: setCocurriculars, work_experiences: setWorkExperience, education_history: setEducationHistory }; // 
    const list = lists[listName];
    const setter = setters[listName];
    const item = list[index];
    if (item?.id) { // 
      setDeletedItems(prev => ({ ...prev, [listName]: [...prev[listName], item.id] }));
    } // 
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const displaySrc = useMemo(() => {
    // 1. If there's a preview, show it.
    if (avatarPreview) {
      return avatarPreview;
    }
    // 2. If there's a saved URL, show it.
    if (avatarUrl) {
      return avatarUrl;
    }
    // 3. If no preview and no saved URL, but we have a name/ID, generate one.
    if (formData.full_name && user?.id) {
      return generateAvatarUrl(formData.full_name, user.id);
    }
    // 4. As a last resort, return undefined (will show initials)
    return undefined;
  }, [avatarPreview, avatarUrl, formData.full_name, user?.id]);

  const showClearPreview = !!avatarPreview; // Show if avatarPreview exists

  // 3. Determine when to show the 'Remove' (Trash) button
  const showRemoveButton = !!avatarUrl && !avatarPreview;

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

  const handleClearPreview = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleRemoveSavedAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl(''); // This is the new line
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

    const isItemEmpty = (item: any, keyFields: string[]) => {
      return keyFields.every(field => {
        const value = item[field];
        if (typeof value === 'string') return !value.trim();
        if (typeof value === 'number') return value === null || value === 0;
        if (Array.isArray(value)) return value.length === 0;
        return !value; // For null, undefined
      });
    };

    const findInvalidItems = (list: any[], isEmptyCheck: (item: any) => boolean, isValidCheck: (item: any) => boolean, name: string) => {
      const invalid = list.filter(item => !isEmptyCheck(item) && !isValidCheck(item));
      return invalid.length > 0 ? name : null;
    };

    const workKeyFields = ['position', 'organization', 'start_date', 'description'];
    const eduKeyFields = ['institution_name', 'institution_id', 'degree', 'field_of_study', 'start_year', 'end_year', 'description'];
    const achievementKeyFields = ['exam_name', 'rank', 'percentile', 'year'];
    const pubKeyFields = ['title', 'authors', 'journal_name', 'url', 'publication_date', 'description'];
    const certKeyFields = ['certification_name', 'issuing_org', 'issue_date', 'credential_id', 'url'];
    const awardKeyFields = ['award_name', 'issuing_org', 'date', 'description'];
    const ventureKeyFields = ['name', 'role', 'description', 'achievements', 'url'];
    const contentKeyFields = ['title', 'url', 'description', 'publication_date'];
    const cocurricularKeyFields = ['title', 'role', 'description', 'start_date', 'end_date'];

    // --- Work Experience ---
    const workIsEmpty = (item: WorkExperienceItem) => isItemEmpty(item, workKeyFields);
    const workIsValid = (item: WorkExperienceItem) => 
      item.position?.trim() && item.organization?.trim() && item.start_date?.trim();
      
    // --- Education History ---
    const eduIsEmpty = (item: EducationHistoryItem) => isItemEmpty(item, eduKeyFields);
    const eduIsValid = (item: EducationHistoryItem) =>
      (item.institution_name?.trim() || (item.institution_id && item.institution_id !== 'other')) &&
      item.degree?.trim() &&
      item.start_year;

    // --- Other Lists (using simple "name/title" validation) ---
    const achIsEmpty = (item: EditableAchievement) => isItemEmpty(item, achievementKeyFields);
    const achIsValid = (item: EditableAchievement) => item.exam_name?.trim();

    const pubIsEmpty = (item: EditablePublication) => isItemEmpty(item, pubKeyFields);
    const pubIsValid = (item: EditablePublication) => item.title?.trim();

    const certIsEmpty = (item: EditableCertification) => isItemEmpty(item, certKeyFields);
    const certIsValid = (item: EditableCertification) => item.certification_name?.trim();

    const awdIsEmpty = (item: EditableAward) => isItemEmpty(item, awardKeyFields);
    const awdIsValid = (item: EditableAward) => item.award_name?.trim();

    const venIsEmpty = (item: EditableVenture) => isItemEmpty(item, ventureKeyFields);
    const venIsValid = (item: EditableVenture) => item.name?.trim();

    const conIsEmpty = (item: EditableContent) => isItemEmpty(item, contentKeyFields);
    const conIsValid = (item: EditableContent) => item.title?.trim() || item.url?.trim();

    const cocIsEmpty = (item: EditableCocurricular) => isItemEmpty(item, cocurricularKeyFields);
    const cocIsValid = (item: EditableCocurricular) => item.title?.trim();

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    // --- Transition Data (Single Object) ---
    // (Run transformation first)
    let finalTransitionData = transitionData ? { ...transitionData } : null;
    if (finalTransitionData && typeof finalTransitionData.target_industries === 'string') {
      (finalTransitionData as any).target_industries = (finalTransitionData.target_industries as string)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    const transIsEmpty = (data: EditableTransition | null) =>
      !data || (!data.transition_status &&
               !(data.target_industries as any)?.length &&
               !data.challenges?.trim() &&
               !data.support_needed?.trim());
    
    // A transition is "valid" if it's not empty and has at least a status.
    const transIsValid = (data: EditableTransition | null) => data?.transition_status;
    
    // --- 3. Run Validation and Show Errors ---
    const validationErrors: (string | null)[] = [];

    validationErrors.push(findInvalidItems(workExperience, workIsEmpty, workIsValid, "Work Experience (requires Position, Organization, Start Date)"));
    validationErrors.push(findInvalidItems(educationHistory, eduIsEmpty, eduIsValid, "Education History (requires Institution, Degree, Start Year)"));
    validationErrors.push(findInvalidItems(achievements, achIsEmpty, achIsValid, "Academic Achievements (requires Exam Name)"));
    validationErrors.push(findInvalidItems(publications, pubIsEmpty, pubIsValid, "Publications (requires Title)"));
    validationErrors.push(findInvalidItems(certifications, certIsEmpty, certIsValid, "Certifications (requires Name)"));
    validationErrors.push(findInvalidItems(awards, awdIsEmpty, awdIsValid, "Awards (requires Name)"));
    validationErrors.push(findInvalidItems(ventures, venIsEmpty, venIsValid, "Ventures (requires Name)"));
    validationErrors.push(findInvalidItems(contentPortfolio, conIsEmpty, conIsValid, "Content Portfolio (requires Title or URL)"));
    validationErrors.push(findInvalidItems(cocurriculars, cocIsEmpty, cocIsValid, "Cocurriculars (requires Title)"));

    // Check transition data
    if (!transIsEmpty(finalTransitionData) && !transIsValid(finalTransitionData)) {
      validationErrors.push("Transition Journey (requires Transition Status)");
    }

    const finalErrors = validationErrors.filter(Boolean); // Remove nulls
    if (finalErrors.length > 0) {
      const errorMsg = `Please complete or remove the following items: ${finalErrors.join(', ')}`;
      setError(errorMsg);
      toast({
        title: "Incomplete Information",
        description: errorMsg,
        variant: "destructive",
      });
      return; // Stop submission
    }

    // --- 4. Create Filtered Lists for Saving ---
    // (These variables will be used inside the try...catch block)
    const filteredWorkExperience = workExperience.filter(item => !workIsEmpty(item));
    const filteredEducationHistory = educationHistory.filter(item => !eduIsEmpty(item));
    const filteredAchievements = achievements.filter(item => !achIsEmpty(item));
    const filteredPublications = publications.filter(item => !pubIsEmpty(item));
    const filteredCertifications = certifications.filter(item => !certIsEmpty(item));
    const filteredAwards = awards.filter(item => !awdIsEmpty(item));
    const filteredVentures = ventures.filter(item => !venIsEmpty(item));
    const filteredContentPortfolio = contentPortfolio.filter(item => !conIsEmpty(item));
    const filteredCocurriculars = cocurriculars.filter(item => !cocIsEmpty(item));
    const validTransitionData = transIsEmpty(finalTransitionData) ? null : finalTransitionData;
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
          achievements: filteredAchievements,
          publications: filteredPublications,
          certifications: filteredCertifications,
          awards: filteredAwards,
          transitionData: validTransitionData,
          ventures: filteredVentures,
          contentPortfolio: filteredContentPortfolio,
          cocurriculars: filteredCocurriculars,
          workExperiences: filteredWorkExperience,
          educationHistory: filteredEducationHistory,
        },
        deletedItems // Deleted items
      );

      toast({
        title: "Profile Saved!",
        description: "Your profile has been updated successfully.",
      });

      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['fullProfile', user.id] });
      localStorage.removeItem(DRAFT_KEY);
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
      localStorage.removeItem(DRAFT_KEY);
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

  const educationLabel = userRole === 'student' 
    ? 'Current Education Details' 
    : 'Latest Education Details';

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
              displaySrc={displaySrc}
              fullName={formData.full_name}
              onAvatarChange={handleAvatarChange}
              onClearPreview={handleClearPreview}
              onRemoveSavedAvatar={handleRemoveSavedAvatar}
              showClearPreview={showClearPreview}
              showRemoveButton={showRemoveButton}
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

              <Accordion type="multiple" className="w-full space-y-4">

                {/* --- CURRENT Professional Info (If applicable) --- */}
                {profileMode === 'clinical' && userRole !== 'student' && (
                  <AccordionItem value="clinical-current-professional">
                    <AccordionTrigger className="text-lg font-semibold"> {/* */}
                      <div className="flex items-center gap-2"> <Briefcase/> Current Professional Details </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      {/* *** CHANGE 3: Add missing props *** */}
                      <ProfileProfessionalInfo
                        formData={formData}
                        onInputChange={handleInputChange}
                        specializationOptions={specializationOptions}
                        onSpecializationSearch={setSpecializationSearch}
                        isSpecLoading={isSpecLoading}
                        experiences={experiences}
                      /> {/* */}
                    </AccordionContent>
                  </AccordionItem>
                )}
                 {/* */}
                 {/* Remove Separator, Accordion handles spacing */}

                {/* --- CURRENT Education Info --- */}
                <AccordionItem value="current-education">
                   <AccordionTrigger className="text-lg font-semibold">
                     <div className="flex items-center gap-2"> <GraduationCap/> {educationLabel} </div>
                   </AccordionTrigger>
                   <AccordionContent className="pt-4">
                     {/* *** CHANGE 3: Add missing props *** */}
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
                     /> {/* */}
                   </AccordionContent>
                </AccordionItem> {/* */}
                {/* Remove Separator */}

                {/* --- REPEATABLE Work Experience --- */}
                <AccordionItem value="work-history">
                    <AccordionTrigger className="text-lg font-semibold"> {/* */}
                       <div className="flex items-center gap-2"> <Briefcase/> Work Experience History </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ProfileWorkExperienceForm
                         items={workExperience}
                         onListChange={handleWorkExperienceChange}
                         onAddItem={addWorkExperience}
                         onRemoveItem={(index) => removeListItem('work_experiences', index)}
                       /> {/* */}
                    </AccordionContent>
                </AccordionItem>
                 {/* Remove Separator */}

                {/* --- REPEATABLE Education History --- */} {/* */}
                <AccordionItem value="education-history">
                    <AccordionTrigger className="text-lg font-semibold"> {/* */}
                       <div className="flex items-center gap-2"> <GraduationCap/> Education History </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ProfileEducationHistoryForm
                         items={educationHistory}
                         onListChange={handleEducationHistoryChange} // 
                         onAddItem={addEducationHistory}
                         onRemoveItem={(index) => removeListItem('education_history', index)}
                         institutionOptions={institutionOptions} // 
                         onInstitutionSearch={setInstitutionSearch}
                         isInstLoading={isInstLoading}
                         courseOptions={courseOptions} // 
                         onCourseSearch={setCourseSearch}
                         isCourseLoading={isCourseLoading}
                       />
                    </AccordionContent>
                </AccordionItem> {/* */}
                 {/* Remove Separator */}

                {/* --- Conditional Clinical Forms --- */}
                {profileMode === 'clinical' && ( // 
                  <> {/* Use Fragment */}
                    {/* Professional Details (Duplicate?) - REMOVED, covered by "Current" above */}
                    {/* Education Details (Duplicate?) - REMOVED, covered by "Current" above */}
                    <AccordionItem value="clinical-achievements"> {/* */}
                      <AccordionTrigger className="text-lg font-semibold"> {/* */}
                        <div className="flex items-center gap-2"> <Award/> Academic Achievements </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ProfileAchievementsForm items={achievements} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('achievements', index)} /> {/* */}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="clinical-publications"> {/* */}
                      <AccordionTrigger className="text-lg font-semibold"> {/* */}
                        <div className="flex items-center gap-2"> <BookOpen/> Research & Publications </div> {/* */}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ProfilePublicationsForm items={publications} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('publications', index)} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="clinical-certs">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2"> <ShieldCheck/> Certifications </div> {/* */}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ProfileCertificationsForm items={certifications} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('certifications', index)} /> {/* */}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="clinical-awards"> {/* */}
                      <AccordionTrigger className="text-lg font-semibold"> {/* */}
                        <div className="flex items-center gap-2"> <Award/> Awards & Honors </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ProfileAwardsForm items={awards} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('awards', index)} />
                      </AccordionContent>
                    </AccordionItem>
                  </>
                )}

                {/* --- Conditional Non-Clinical Forms --- */}
                {profileMode === 'non_clinical' && (
                  <> {/* Use Fragment */}
                     <AccordionItem value="nonclinical-transition"> {/* */}
                       <AccordionTrigger className="text-lg font-semibold">
                         <div className="flex items-center gap-2"> <HeartHandshake/> My Transition Journey </div> {/* */}
                       </AccordionTrigger>
                       <AccordionContent>
                         <ProfileTransitionInfo formData={transitionData || { profile_id: user.id }} onTransitionChange={handleTransitionChange} /> {/* */}
                       </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="nonclinical-ventures"> {/* */}
                       <AccordionTrigger className="text-lg font-semibold"> {/* */}
                         <div className="flex items-center gap-2"> <Lightbulb/> Ventures & Projects </div> {/* */}
                       </AccordionTrigger>
                       <AccordionContent>
                         <ProfileVenturesForm items={ventures} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('ventures', index)} />
                       </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="nonclinical-content">
                       <AccordionTrigger className="text-lg font-semibold">
                         <div className="flex items-center gap-2"> <Megaphone/> Content Portfolio </div> {/* */}
                       </AccordionTrigger>
                       <AccordionContent> {/* */}
                         <ProfileContentForm items={contentPortfolio} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('content_portfolio', index)} />
                       </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="nonclinical-clinical-bg"> {/* */}
                       <AccordionTrigger className="text-lg font-semibold">
                         <div className="flex items-center gap-2"> <Briefcase/> Clinical Background (Foundation) </div> {/* */}
                       </AccordionTrigger>
                       <AccordionContent className="pt-4 space-y-6"> {/* */}
                         {/* *** CHANGE 3: Add missing props *** */}
                         <ProfileProfessionalInfo
                           formData={formData} // 
                           onInputChange={handleInputChange}
                           specializationOptions={specializationOptions}
                           onSpecializationSearch={setSpecializationSearch}
                           isSpecLoading={isSpecLoading} // 
                           experiences={experiences}
                         />
                         <Separator />
                         {/* *** CHANGE 3: Add missing props *** */}
                         <ProfileEducationInfo // 
                           formData={formData}
                           onInputChange={handleInputChange}
                           institutionOptions={institutionOptions}
                           onInstitutionSearch={setInstitutionSearch} // 
                           isInstLoading={isInstLoading}
                           courseOptions={courseOptions}
                           onCourseSearch={setCourseSearch}
                           isCourseLoading={isCourseLoading}
                           studentYears={studentYears} // 
                           userRole={userRole}
                         />
                       </AccordionContent>
                     </AccordionItem>
                  </>
                )}

                {/* --- Shared Sections --- */}
                {/* Remove Separator */}
                <AccordionItem value="shared-cocurriculars"> {/* */}
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2"> <Palette/> Cocurriculars & Organizing </div> {/* */}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ProfileCocurricularsForm items={cocurriculars} onListChange={handleListChange} onAddItem={addListItem} onRemoveItem={(index) => removeListItem('cocurriculars', index)} />
                  </AccordionContent>
                </AccordionItem> {/* */}
                <AccordionItem value="shared-about">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2"> <User className="h-5 w-5 text-primary"/> About & Links </div> {/* */}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <ProfileAboutInfo formData={formData} onInputChange={handleInputChange} /> {/* */}
                  </AccordionContent>
                </AccordionItem>

              </Accordion> 

              {/* --- Form Actions --- */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" size="lg" className="btn-medical w-full sm:flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'} 
                  <Save className="ml-2 h-5 w-5" />
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={handleSkip} disabled={isSubmitting} className="w-full sm:w-auto"> {/* */}
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
}; // *** CHANGE 1: Remove extra closing brace here ***

// --- PageSkeleton --- // 
const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="py-12">
      <Card className="card-medical max-w-2xl mx-auto">
        <CardHeader> <Skeleton className="h-8 w-48" /> <Skeleton className="h-4 w-64 mt-2" /> </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center mb-8 space-y-2"> <Skeleton className="h-24 w-24 rounded-full" /> </div> {/* */}
          <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-24 w-full" /> <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </main>
    <Footer /> 
  </div>
);

export default CompleteProfile;
