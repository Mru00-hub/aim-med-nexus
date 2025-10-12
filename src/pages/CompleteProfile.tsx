// src/pages/CompleteProfile.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// UI Components
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Save } from 'lucide-react';

// Reusable Form Field Components
import { EducationalFields, ProfessionalFields, PremiumFields } from './FormFields';

// --- NEW SKELETON COMPONENT ---
const CompleteProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-12 px-4 sm:px-6">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex flex-col items-center space-y-2">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

const generateUniqueColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  const saturation = 70 + (hash % 21);
  const lightness = 40 + (hash % 21);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};


const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const userRole = searchParams.get('role');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [formData, setFormData] = useState({
    full_name: '', phone: '', current_location: '', otherLocation: '', bio: '',
    institution: '', otherInstitution: '', course: '', otherCourse: '', year_of_study: '',
    current_position: '', organization: '', specialization: '', otherSpecialization: '',
    years_experience: '', medical_license: '',
  });

  useEffect(() => {
    if (!authLoading && !userRole) {
      console.warn("User landed on complete-profile without a role. Redirecting.");
      navigate('/select-role', { replace: true });
      return;
    }

    if (user) {
      const metadata = user.user_metadata || {};
      setFormData(prev => ({ ...prev, full_name: metadata.full_name || '' }));
      
      if (metadata.full_name && !profile?.profile_picture_url) {
        const uniqueColor = generateUniqueColor(user.id).replace('#', '');
        const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          metadata.full_name
        )}&background=${uniqueColor}&color=fff&size=256`;
        setAvatarUrl(generatedUrl);
      }
    }

    if (profile) {
       setAvatarUrl(profile.profile_picture_url || avatarUrl);
    }
  }, [user, profile, userRole, navigate, authLoading, avatarUrl]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userRole) {
      toast({ title: "Error", description: "Session invalid. Please try again.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const finalData = {
      id: user.id, email: user.email, full_name: formData.full_name,
      phone: formData.phone, user_role: userRole,
      current_location: formData.current_location === 'other' ? formData.otherLocation : formData.current_location,
      bio: formData.bio, institution: formData.institution === 'other' ? formData.otherInstitution : formData.institution,
      course: formData.course === 'other' ? formData.otherCourse : formData.course,
      year_of_study: formData.year_of_study, current_position: formData.current_position,
      organization: formData.organization, specialization: formData.specialization === 'other' ? formData.otherSpecialization : formData.specialization,
      years_experience: formData.years_experience, medical_license: formData.medical_license,
      profile_picture_url: avatarUrl, is_onboarded: true,
    };
    
    if (userRole === 'student') {
      delete (finalData as any).current_position; delete (finalData as any).organization;
      delete (finalData as any).specialization; delete (finalData as any).years_experience; delete (finalData as any).medical_license;
    } else {
      delete (finalData as any).year_of_study;
    }
    if (userRole !== 'premium') {
      delete (finalData as any).medical_license;
    }

    const { error } = await supabase.from('profiles').upsert(finalData);

    setIsSubmitting(false);

    if (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: `Could not save your profile. ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Profile Saved!", description: "Welcome to AIMedNet!" });
      await refreshProfile();
      if (userRole === 'premium') {
         navigate('/payment', { replace: true });
      } else {
         navigate('/community', { replace: true });
      }
    }
  };

  if (authLoading || !userRole) {
    return <CompleteProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-12 px-4 sm:px-6">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Complete Your {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Profile</CardTitle>
            <CardDescription>
              Welcome! Please provide the following details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-8 space-y-2">
                <Avatar className="h-24 w-24 border-2 border-primary/50">
                  <AvatarImage src={avatarUrl} alt={formData.full_name} />
                  <AvatarFallback>{formData.full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">Your profile avatar</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>

              <EducationalFields formData={formData} onSelectChange={handleSelectChange} onInputChange={handleInputChange} />
              
              {userRole === 'student' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Year/Status *</label>
                  <Select value={formData.year_of_study} onValueChange={(value) => handleSelectChange('year_of_study', value)}>
                    <SelectTrigger><SelectValue placeholder="Current year/status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="intern">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {userRole === 'professional' && <ProfessionalFields formData={formData} onSelectChange={handleSelectChange} onInputChange={handleInputChange} />}
              {userRole === 'premium' && <PremiumFields formData={formData} onSelectChange={handleSelectChange} onInputChange={handleInputChange} />}

              <div>
                <label className="block text-sm font-medium mb-2">Professional Bio</label>
                <Textarea value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="A brief summary of your background, interests, and goals..." rows={4} />
              </div>

              <Button type="submit" size="lg" className="btn-medical w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (userRole === 'premium' ? 'Proceed to Payment' : 'Save Profile')}
                <Save className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CompleteProfile;
