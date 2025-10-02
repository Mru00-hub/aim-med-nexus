// src/pages/CompleteProfile.tsx

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

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth(); // Get the user and their existing profile
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    current_location: '',
    current_position: '',
    organization: '',
    bio: '',
    resume_url: '',
    skills: '', // We'll handle this as a comma-separated string in the UI
  });

  // This effect runs when the component loads and whenever the user's profile data becomes available.
  // It populates the form with the data that already exists in the database.
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
        skills: profile.skills ? profile.skills.join(', ') : '', // Convert array to string for the textarea
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // This handleSubmit now performs an UPDATE, not an INSERT.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User not found. Please log in again.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Convert the comma-separated skills string back into an array for the database
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
        updated_at: new Date().toISOString(), // Good practice to update this timestamp
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id); // IMPORTANT: Only update the row for the currently logged-in user

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Profile Updated!",
        description: "Your information has been saved successfully.",
      });
      navigate('/community'); // Or navigate to a dedicated profile page

    } catch (err: any) {
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading your profile...</div>; // Or a proper skeleton loader
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-12 px-4 sm:px-6">
        <Card className="card-medical max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Edit Your Profile</CardTitle>
            <CardDescription>
              Keep your professional information up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Add form fields for all the editable properties */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Position</label>
                <Input value={formData.current_position} onChange={(e) => handleInputChange('current_position', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                <Textarea value={formData.skills} onChange={(e) => handleInputChange('skills', e.target.value)} placeholder="e.g., Cardiology, Python, Public Speaking" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Resume URL</label>
                <Input value={formData.resume_url} onChange={(e) => handleInputChange('resume_url', e.target.value)} placeholder="https://linkedin.com/in/your-profile/..." />
              </div>
              
              {/* Add any other fields you want to be editable here */}

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
