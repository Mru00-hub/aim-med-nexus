// src/pages/CompleteProfile.tsx

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
import { Save } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        current_location: profile.current_location || '',
        current_position: profile.current_position || '',
        organization: profile.organization || '',
        bio: profile.bio || '',
        resume_url: profile.resume_url || '',
        skills: profile.skills ? profile.skills.join(', ') : '',
      });

      if (profile.profile_picture_url) {
        setAvatarUrl(profile.profile_picture_url);
      } else if (profile.full_name) {
        const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.full_name
        )}&background=0D8ABC&color=fff&size=256`;
        setAvatarUrl(generatedUrl);
      }
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User not found. Please log in again.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

      const updates = {
        full_name: formData.full_name,
        phone: formData.phone,
        current_location: formData.current_location,
        current_position: formData.current_position,
        organization: formData.organization,
        bio: formData.bio,
        resume_url: formData.resume_url,
        skills: skillsArray,
        profile_picture_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Profile Updated!",
        description: "Your information has been saved successfully.",
      });
      navigate('/profile');

    } catch (err: any) {
      setError(`Failed to update profile: ${err.message}`);
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
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
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-12 px-4 sm:px-6">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">
              {profile.bio ? "Edit Your Profile" : "Complete Your Profile"}
            </CardTitle>
            <CardDescription>
              {profile.bio 
                ? "Keep your professional information up to date."
                : "Welcome! Please review your information and add a few more details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avatarUrl && (
              <div className="flex flex-col items-center mb-8 space-y-2">
                <Avatar className="h-24 w-24 border-2 border-primary/50">
                  <AvatarImage src={avatarUrl} alt={profile?.full_name} />
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('')}
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
                <Input type="url" value={formData.resume_url} onChange={(e) => handleInputChange('resume_url', e.g., target.value)} placeholder="https://linkedin.com/in/your-profile/..." />
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" size="lg" className="btn-medical w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
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
