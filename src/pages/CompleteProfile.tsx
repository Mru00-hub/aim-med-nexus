import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect } from 'react';
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
import { Save, AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CompleteProfile = () => {
  console.log("[CompleteProfile] Component mounted");
  
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    current_location: '',
    current_position: '',
    organization: '',
    bio: '',
    resume_url: '',
    skills: '',
  });

  console.log("[CompleteProfile] Current state:");
  console.log("[CompleteProfile] authLoading:", authLoading);
  console.log("[CompleteProfile] user:", user ? user.id : "null");
  console.log("[CompleteProfile] profile:", profile ? "exists" : "null");

  useEffect(() => {
    console.log("[CompleteProfile] useEffect triggered");
    console.log("[CompleteProfile] User:", user ? user.id : "null");
    console.log("[CompleteProfile] Profile:", profile ? "exists" : "null");
    
    try {
      if (user) {
        console.log("[CompleteProfile] Processing user data");
        const metadata = user.user_metadata || {};
        console.log("[CompleteProfile] User metadata:", JSON.stringify(metadata, null, 2));
        
        // Map metadata to form fields - COMPLETE MAPPING
        const mappedData = {
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          current_location: metadata.current_location || '',
          current_position: metadata.current_position || '',
          organization: metadata.organization || '',
          bio: '',
          resume_url: '',
          skills: metadata.specialization ? metadata.specialization : '',
        };
        
        console.log("[CompleteProfile] Mapped form data:", JSON.stringify(mappedData, null, 2));
        setFormData(mappedData);

        // Generate avatar from metadata name
        if (metadata.full_name) {
          const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            metadata.full_name
          )}&background=0D8ABC&color=fff&size=256`;
          console.log("[CompleteProfile] Generated avatar URL:", generatedUrl);
          setAvatarUrl(generatedUrl);
        }
      }

      // If profile exists (editing scenario), override with profile data
      if (profile) {
        console.log("[CompleteProfile] Profile exists - entering EDIT mode");
        console.log("[CompleteProfile] Profile data:", JSON.stringify(profile, null, 2));
        
        const skillsString = profile.skills && Array.isArray(profile.skills) 
          ? profile.skills.join(', ') 
          : '';

        const profileData = {
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          current_location: profile.current_location || '',
          current_position: profile.current_position || '',
          organization: profile.organization || '',
          bio: profile.bio || '',
          resume_url: profile.resume_url || '',
          skills: skillsString,
        };
        
        console.log("[CompleteProfile] Profile-based form data:", JSON.stringify(profileData, null, 2));
        setFormData(profileData);

        if (profile.profile_picture_url) {
          console.log("[CompleteProfile] Using existing avatar:", profile.profile_picture_url);
          setAvatarUrl(profile.profile_picture_url);
        }
      }
    } catch (e: any) {
      console.error("[CompleteProfile] Error processing data:", e);
      console.error("[CompleteProfile] Error message:", e.message);
      console.error("[CompleteProfile] Error stack:", e.stack);
      setError("Failed to load your profile data. Please try refreshing the page.");
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`[CompleteProfile] Field changed: ${field} = ${value.substring(0, 50)}...`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CompleteProfile] Form submitted");
    
    if (!user) {
      console.error("[CompleteProfile] No user found");
      setError("User not found. Please log in again.");
      return;
    }
    
    console.log("[CompleteProfile] Submitting for user:", user.id);
    console.log("[CompleteProfile] Form data:", JSON.stringify(formData, null, 2));
    
    setIsSubmitting(true);
    setError('');

    try {
      const metadata = user.user_metadata || {};
      console.log("[CompleteProfile] User metadata for profile creation:", JSON.stringify(metadata, null, 2));
      
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      console.log("[CompleteProfile] Processed skills array:", skillsArray);

      const finalAvatarUrl = avatarUrl || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          formData.full_name
        )}&background=0D8ABC&color=fff&size=256`;
      console.log("[CompleteProfile] Final avatar URL:", finalAvatarUrl);

      // Complete profile data with metadata fallbacks
      const profileData = {
        id: user.id,
        email: user.email || metadata.email,
        full_name: formData.full_name,
        phone: formData.phone,
        user_role: metadata.user_role || 'professional',
        current_location: formData.current_location,
        profile_picture_url: finalAvatarUrl,
        bio: formData.bio,
        years_experience: metadata.years_experience || null,
        is_verified: metadata.email_verified || false,
        institution: metadata.institution || null,
        course: metadata.course || null,
        year_of_study: metadata.year_of_study || null,
        current_position: formData.current_position,
        organization: formData.organization,
        specialization: metadata.specialization || null,
        medical_license: metadata.medical_license || null,
        resume_url: formData.resume_url,
        skills: skillsArray,
        is_onboarded: true,
      };

      console.log("[CompleteProfile] Final profile data to upsert:");
      console.log(JSON.stringify(profileData, null, 2));
      console.log("[CompleteProfile] Calling Supabase upsert...");

      const { data: upsertedData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();
      const { refreshProfile } = useAuth();

      console.log("[CompleteProfile] Upsert operation completed");
      console.log("[CompleteProfile] Returned data:", upsertedData ? "Success" : "No data");
      console.log("[CompleteProfile] Error:", upsertError ? "YES" : "NO");

      const { error: upsertError } = await supabase.from('profiles').upsert(...);
      if (!upsertError) {
        await refreshProfile(); // Manually refresh the context state
        navigate('/community');
      }

      if (upsertError) {
        console.error("[CompleteProfile] Upsert failed");
        console.error("[CompleteProfile] Error code", upsertError.code);
        console.error("[CompleteProfile] Error message", upsertError.message);
        console.error("[CompleteProfile] Error details:", upsertError.details);
        console.error("[CompleteProfile] Full error object:", JSON.stringify(upsertError, null, 2));
        // Check for specific error types
        if (upsertError.code === '42501') {
          console.error("[CompleteProfile] RLS POLICY ERROR - User doesn't have permission");
          throw new Error("Permission denied. Please contact support about RLS policies.");
        } else if (upsertError.code === '23505') {
          console.error("[CompleteProfile] UNIQUE CONSTRAINT VIOLATION");
          throw new Error("A profile with this ID already exists.");
        } else {
          throw upsertError;
        }
      }

      console.log("[CompleteProfile] Profile saved successfully!");
      console.log("[CompleteProfile] Upserted data:", JSON.stringify(upsertedData, null, 2));
      toast({
        title: "Profile Saved!",
        description: "Your profile has been created successfully.",
      });
      
      console.log("[CompleteProfile] Navigating to /community");
      navigate('/community', { replace: true });

    } catch (err: any) {
      console.error("[CompleteProfile] Fatal error in handleSubmit:", err);
      console.error("[CompleteProfile] Error type:", err.constructor.name);
      console.error("[CompleteProfile] Error message:", err.message);
      console.error("[CompleteProfile] Error stack:", err.stack);
      
      const errorMessage = `Failed to save profile: ${err.message}`;
      console.error("[CompleteProfile] Showing error to user:", errorMessage);
      
      setError(errorMessage); // Set the error state to display it in the UI
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // The navigate call has been removed. The user stays on the page.
    }

  const handleSkip = () => {
    console.log("[CompleteProfile] User clicked Skip for Now");
    console.log("[CompleteProfile] Navigating to /community without saving");
    navigate('/community', { replace: true });
  };

  if (authLoading) {
    console.log("[CompleteProfile] Auth still loading, showing skeleton");
    return <PageSkeleton />;
  }

  if (error) {
    console.log("[CompleteProfile] Error state, showing error alert");
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
    console.log("[CompleteProfile] No user found, showing skeleton");
    return <PageSkeleton />;
  }

  console.log("[CompleteProfile] Rendering form");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-12 px-4 sm:px-6">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">
              {profile ? "Edit Your Profile" : "Complete Your Profile"}
            </CardTitle>
            <CardDescription>
              {profile 
                ? "Keep your professional information up to date."
                : "Welcome! Please review your information and add a few more details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avatarUrl && (
              <div className="flex flex-col items-center mb-8 space-y-2">
                <Avatar className="h-24 w-24 border-2 border-primary/50">
                  <AvatarImage src={avatarUrl} alt={formData.full_name} />
                  <AvatarFallback>
                    {formData.full_name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  Your profile avatar
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Position</label>
                <Input value={formData.current_position} onChange={(e) => handleInputChange('current_position', e.target.value)} placeholder="e.g., Resident Doctor, Medical Student" />
              </div>
               <div>
                <label className="block text-sm font-medium mb-2">Organization</label>
                <Input value={formData.organization} onChange={(e) => handleInputChange('organization', e.target.value)} placeholder="e.g., City Hospital, AIIMS Delhi" />
              </div>
               <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input value={formData.current_location} onChange={(e) => handleInputChange('current_location', e.target.value)} placeholder="e.g., Nagpur, India" />
              </div>
               <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Professional Bio</label>
                <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="A brief summary of your background, interests, and goals..." rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                <Textarea value={formData.skills} onChange={(e) => handleInputChange('skills', e.target.value)} placeholder="e.g., Cardiology, Python, Public Speaking" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Resume/CV URL</label>
                <Input type="url" value={formData.resume_url} onChange={(e) => handleInputChange('resume_url', e.target.value)} placeholder="https://linkedin.com/in/your-profile/..." />
              </div>
              
              <div className="flex gap-4">
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
