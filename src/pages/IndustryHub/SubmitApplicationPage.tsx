import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getJobById,
  getCollabById,
  applyForJob,
  applyForCollaboration,
} from '@/integrations/supabase/industry.api';
import { 
  saveProfileDetails, 
  EditableWorkExperience, 
  EditableEducationHistory 
} from '@/integrations/supabase/user.api';
import { supabase } from '@/integrations/supabase/client';

// UI Components
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, AlertCircle, FileText, User, CheckCircle2, XCircle, Plus, UploadCloud, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Profile Edit Components
import { ProfileWorkExperienceForm } from '@/components/profile-edit/ProfileWorkExperienceForm';
import { ProfileEducationHistoryForm } from '@/components/profile-edit/ProfileEducationHistoryForm';

// --- Types ---
type ApplicationType = 'job' | 'collaboration';
type ClientItem<T> = T & { client_id?: string };
type Option = { id: string; label: string; value: string };

// Fields that are inputs on this page (not profile checks)
const INPUT_REQUIREMENTS = ['current_salary', 'expected_salary'];

// Helper: Seed dropdown list to ensure selected value is visible
function seedDropdownList(list: Option[], item: Option | null | undefined): Option[] {
  if (!item) return list;
  if (list.find(i => i.id === item.id)) return list;
  return [item, ...list];
}

// Helper: Check profile requirements
const checkProfileRequirements = (profile: any, requirements: string[] = []) => {
  const missing: string[] = [];
  const profileReqs = requirements.filter(r => !INPUT_REQUIREMENTS.includes(r));

  profileReqs.forEach(req => {
    if (req === 'resume' && !profile.resume_url) missing.push('Resume');
    if (req === 'bio' && !profile.bio) missing.push('Bio');
    if (req === 'location' && !profile.location_id && !profile.location_other) missing.push('Location');
    if (req === 'organization' && !profile.organization) missing.push('Current Organization');
    if (req === 'position' && !profile.current_position) missing.push('Current Position');
    if (req === 'skills' && (!profile.skills || profile.skills.length === 0)) missing.push('Skills');
    
    // Check Arrays
    if (req === 'work_experience' && (!profile.work_experiences || profile.work_experiences.length === 0)) missing.push('Work Experience');
    if (req === 'education_history' && (!profile.education_history || profile.education_history.length === 0)) missing.push('Education History');
  });
  return missing;
};

export default function SubmitApplicationPage() {
  const { jobId, collabId } = useParams<{ jobId?: string; collabId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Form State ---
  const [coverLetter, setCoverLetter] = useState('');
  const [salaryInfo, setSalaryInfo] = useState({ current: '', expected: '' });
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // --- Modal State ---
  const [activeFix, setActiveFix] = useState<string | null>(null);
  const [isSavingFix, setIsSavingFix] = useState(false);
  
  // Temp State for Modals
  const [tempWork, setTempWork] = useState<ClientItem<EditableWorkExperience>[]>([]);
  const [tempEdu, setTempEdu] = useState<ClientItem<EditableEducationHistory>[]>([]);
  const [tempBioLoc, setTempBioLoc] = useState({ bio: '', organization: '', position: '' });

  // --- Search State for Dropdowns (Required for Education Form) ---
  const [institutions, setInstitutions] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [isInstLoading, setIsInstLoading] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(false);

  const applicationType: ApplicationType = jobId ? 'job' : 'collaboration';
  const id = jobId || collabId;

  // 1. Fetch Opportunity
  const { data: opportunity, isLoading: isLoadingData, isError } = useQuery({
    queryKey: [applicationType === 'job' ? 'jobDetails' : 'collabDetails', id],
    queryFn: () => (!id ? null : applicationType === 'job' ? getJobById(id) : getCollabById(id)),
    enabled: !!id,
  });

  // 2. Fetch User Profile
  const { data: fullProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['fullProfileForApp', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, work_experiences(*), education_history(*)`)
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 3. Load existing data into Temp State
  useEffect(() => {
    if (fullProfile) {
      setTempWork(fullProfile.work_experiences || []);
      setTempEdu(fullProfile.education_history || []);
      setTempBioLoc({
        bio: fullProfile.bio || '',
        organization: fullProfile.organization || '',
        position: fullProfile.current_position || ''
      });
    }
  }, [fullProfile]);

  // --- DROPDOWN SEARCH EFFECTS (Logic copied from CompleteProfile) ---
  useEffect(() => {
    setIsInstLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('institutions')
        .select('id, label, value')
        .neq('value', 'other')
        .or(`label.ilike.%${institutionSearch}%,value.ilike.%${institutionSearch}%`)
        .order('label')
        .limit(20);
      if (data) setInstitutions(data);
      setIsInstLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [institutionSearch]);

  useEffect(() => {
    setIsCourseLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, label, value')
        .neq('value', 'other')
        .or(`label.ilike.%${courseSearch}%,value.ilike.%${courseSearch}%`)
        .order('label')
        .limit(20);
      if (data) setCourses(data);
      setIsCourseLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [courseSearch]);

  const institutionOptions = useMemo(() => institutions.map(i => ({ value: i.id, label: i.label })), [institutions]);
  const courseOptions = useMemo(() => courses.map(c => ({ value: c.id, label: c.label })), [courses]);

  // --- Requirements Logic ---
  const missingProfileReqs = fullProfile && opportunity?.required_profile_fields 
    ? checkProfileRequirements(fullProfile, opportunity.required_profile_fields)
    : [];

  const isRequirementPresent = (field: string) => opportunity?.required_profile_fields?.includes(field);
  
  const isCurrentSalaryMissing = applicationType === 'job' && isRequirementPresent('current_salary') && !salaryInfo.current;
  const isExpectedSalaryMissing = isRequirementPresent('expected_salary') && !salaryInfo.expected;

  const canSubmit = missingProfileReqs.length === 0 && !isCurrentSalaryMissing && !isExpectedSalaryMissing;

  // --- Handlers ---
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setIsUploadingResume(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      // Ensure 'resumes' bucket exists in your Supabase Storage
      await supabase.storage.from('resumes').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
      await supabase.from('profiles').update({ resume_url: publicUrl }).eq('id', user.id);
      await queryClient.invalidateQueries({ queryKey: ['fullProfileForApp'] });
      toast({ title: "Success", description: "Resume uploaded." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleTempListChange = (listType: 'work' | 'edu', index: number, field: string, value: any) => {
    const setter = listType === 'work' ? setTempWork : setTempEdu;
    setter((prev: any) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const addTempItem = (listType: 'work' | 'edu') => {
    if (listType === 'work') {
      setTempWork(prev => [...prev, { position: '', organization: '', start_date: '', id: crypto.randomUUID() } as any]);
    } else {
      setTempEdu(prev => [...prev, { institution_name: '', degree: '', start_year: null, id: crypto.randomUUID() } as any]);
    }
  };

  const removeTempItem = (listType: 'work' | 'edu', id: string) => {
    const setter = listType === 'work' ? setTempWork : setTempEdu;
    setter((prev: any) => prev.filter((i: any) => (i.id || i.client_id) !== id));
  };

  const handleSaveFix = async () => {
    setIsSavingFix(true);
    try {
      // Empty payloads for items we aren't touching
      const emptyLists = { academic_achievements: [], publications: [], certifications: [], awards: [], ventures: [], content_portfolio: [], cocurriculars: [], work_experiences: [], education_history: [] };
      const emptyPayload = { achievements: [], publications: [], certifications: [], awards: [], transitionData: null, ventures: [], contentPortfolio: [], cocurriculars: [], workExperiences: [], educationHistory: [] };

      if (activeFix === 'work_experience') {
        await saveProfileDetails({ ...emptyPayload, workExperiences: tempWork }, emptyLists);
      } else if (activeFix === 'education_history') {
        await saveProfileDetails({ ...emptyPayload, educationHistory: tempEdu }, emptyLists);
      } else if (activeFix === 'bio') {
        await supabase.rpc('update_profile', { p_bio: tempBioLoc.bio });
      } else if (activeFix === 'organization' || activeFix === 'position') {
        await supabase.rpc('update_profile', { p_organization: tempBioLoc.organization, p_current_position: tempBioLoc.position });
      }

      await queryClient.invalidateQueries({ queryKey: ['fullProfileForApp'] });
      toast({ title: "Updated", description: "Profile information saved." });
      setActiveFix(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingFix(false);
    }
  };

  const { mutate: submitApplication, isPending: isSubmitting } = useMutation({
    mutationFn: () => {
      const payload: any = {
        p_cover_letter: coverLetter || null,
        ...(applicationType === 'job' ? { p_job_id: jobId! } : { p_collab_id: collabId! }),
      };

      if (applicationType === 'job') {
        payload.p_current_salary = salaryInfo.current || null;
        payload.p_expected_salary = salaryInfo.expected || null;
        return applyForJob(payload);
      } else {
        payload.p_expected_salary = salaryInfo.expected || null;
        return applyForCollaboration(payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Application Submitted!', description: `Your application has been sent.` });
      navigate('/industryhub/my-applications');
    },
    onError: (err) => {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    submitApplication();
  };

  if (isLoadingData || isLoadingProfile) return <div className="p-12"><Skeleton className="h-64 w-full" /></div>;
  if (isError || !opportunity) return <div className="p-12">Opportunity not found.</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="container-medical flex-1 py-12">
        <Card className="mx-auto max-w-3xl shadow-lg">
          <CardHeader>
            <CardDescription>You are applying for:</CardDescription>
            <CardTitle className="text-3xl">{opportunity.title}</CardTitle>
            <p className="text-muted-foreground">at {opportunity.company_name}</p>
          </CardHeader>
          <CardContent>
            
            {opportunity.required_profile_fields?.length > 0 && (
              <div className="mb-8 rounded-lg border p-4 bg-background">
                <h3 className="font-semibold mb-3">Application Requirements</h3>
                <div className="space-y-3">
                  
                  {opportunity.required_profile_fields
                    .filter((req: string) => !INPUT_REQUIREMENTS.includes(req))
                    .map((req: string) => {
                      const isMissing = checkProfileRequirements(fullProfile, [req]).length > 0;
                      const labelMap: Record<string, string> = {
                        resume: 'Resume / CV', bio: 'Bio', work_experience: 'Work Experience',
                        education_history: 'Education History', skills: 'Skills', location: 'Location',
                        organization: 'Current Organization', position: 'Current Position'
                      };
                      const label = labelMap[req] || req.replace('_', ' ');

                      if (req === 'resume' && isMissing) {
                        return (
                          <div key={req} className="flex flex-col gap-2 p-3 rounded bg-red-50 border border-red-100">
                            <div className="flex items-center gap-2 text-destructive font-medium">
                              <XCircle className="h-5 w-5" /> Resume is missing
                            </div>
                            <div className="flex items-center gap-2 pl-7">
                              <Input type="file" accept=".pdf,.doc,.docx" className="max-w-xs bg-white"
                                onChange={handleResumeUpload} disabled={isUploadingResume} />
                              {isUploadingResume && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={req} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2">
                            {!isMissing ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                            <span className={isMissing ? 'text-destructive font-medium' : ''}>{label}</span>
                          </div>
                          {isMissing && (
                            <Button size="sm" variant="outline" onClick={() => setActiveFix(req)}>
                              <Plus className="mr-2 h-3 w-3" /> Add Info
                            </Button>
                          )}
                        </div>
                      );
                  })}

                  {/* Salary Inputs */}
                  {applicationType === 'job' && isRequirementPresent('current_salary') && (
                    <div className="p-3 rounded bg-blue-50/50 border border-blue-100 space-y-2">
                      <div className="flex items-center gap-2">
                        {salaryInfo.current ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5 text-blue-500" />}
                        <Label htmlFor="curr_sal" className="font-medium">Current Salary / CTC</Label>
                      </div>
                      <Input id="curr_sal" placeholder="e.g. 12 LPA" value={salaryInfo.current} onChange={(e) => setSalaryInfo(p => ({...p, current: e.target.value}))} className="bg-white max-w-md" />
                    </div>
                  )}

                  {isRequirementPresent('expected_salary') && (
                    <div className="p-3 rounded bg-blue-50/50 border border-blue-100 space-y-2">
                      <div className="flex items-center gap-2">
                        {salaryInfo.expected ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <DollarSign className="h-5 w-5 text-blue-500" />}
                        <Label htmlFor="exp_sal" className="font-medium">
                          {applicationType === 'job' ? 'Expected Salary / CTC' : 'Expected Remuneration / Stipend'}
                        </Label>
                      </div>
                      <Input id="exp_sal" placeholder={applicationType === 'job' ? "e.g. 15 LPA" : "e.g. 50k for project"} value={salaryInfo.expected} onChange={(e) => setSalaryInfo(p => ({...p, expected: e.target.value}))} className="bg-white max-w-md" />
                    </div>
                  )}

                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className={!canSubmit ? 'opacity-50 pointer-events-none' : ''}>
                <Label className="text-base font-medium block mb-2">Cover Letter (Optional)</Label>
                <Textarea placeholder="Write a brief message..." rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
              </div>

              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* --- FIX INFO MODAL --- */}
      <Dialog open={!!activeFix} onOpenChange={(open) => !open && setActiveFix(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Add the missing information to continue.</DialogDescription>
          </DialogHeader>

          {activeFix === 'work_experience' && (
            <ProfileWorkExperienceForm items={tempWork} onListChange={(i, f, v) => handleTempListChange('work', i, f, v)} onAddItem={() => addTempItem('work')} onRemoveItem={(id) => removeTempItem('work', id)} />
          )}

          {activeFix === 'education_history' && (
            <ProfileEducationHistoryForm 
              items={tempEdu} 
              onListChange={(i, f, v) => handleTempListChange('edu', i, f, v)} 
              onAddItem={() => addTempItem('edu')} 
              onRemoveItem={(id) => removeTempItem('edu', id)} 
              // ✅ NOW WIRED UP CORRECTLY
              institutionOptions={institutionOptions} 
              onInstitutionSearch={setInstitutionSearch}
              isInstLoading={isInstLoading}
              courseOptions={courseOptions}
              onCourseSearch={setCourseSearch}
              isCourseLoading={isCourseLoading}
            />
          )}

          {activeFix === 'bio' && (
            <div className="py-4 space-y-2">
              <Label>Bio / Summary</Label>
              <Textarea value={tempBioLoc.bio} onChange={(e) => setTempBioLoc(p => ({...p, bio: e.target.value}))} placeholder="Tell us about yourself..." />
            </div>
          )}

          {(activeFix === 'organization' || activeFix === 'position') && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Current Organization</Label>
                <Input value={tempBioLoc.organization} onChange={(e) => setTempBioLoc(p => ({...p, organization: e.target.value}))} placeholder="Company Name" />
              </div>
              <div className="space-y-2">
                <Label>Current Position</Label>
                <Input value={tempBioLoc.position} onChange={(e) => setTempBioLoc(p => ({...p, position: e.target.value}))} placeholder="Job Title" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setActiveFix(null)}>Cancel</Button>
            <Button onClick={handleSaveFix} disabled={isSavingFix}>
              {isSavingFix && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
