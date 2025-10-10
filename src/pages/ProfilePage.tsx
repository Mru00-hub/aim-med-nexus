// src/pages/ProfilePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Edit, Mail, Phone, MapPin, Briefcase, Building, Award, Calendar, GraduationCap, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type WorkExperience = {
  title: string;
  company: string;
  years: string;
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: ownProfile, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || user?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      // Reset state on each fetch
      setLoading(true);
      setError(null);

      // --- THIS ENTIRE BLOCK IS NOW WRAPPED IN TRY/CATCH ---
      try {
        if (isOwnProfile) {
          // Wait for the auth context to finish loading
          if (authLoading) return;
          setProfileData(ownProfile);

        } else {
          // Fetch public profile for another user
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select(`
              full_name, user_role, current_location, profile_picture_url, bio,
              years_experience, institution, course, year_of_study, current_position,
              organization, specialization, skills, work_experience
            `)
            .eq('id', userId)
            .single();

          if (fetchError) {
            // If Supabase returns an error (e.g., user not found), throw it to the catch block
            throw fetchError;
          }
          setProfileData(data as Profile);
        }
      } catch (e: any) {
        // --- THIS CATCH BLOCK BRINGS BACK YOUR ERROR LOGGING ---
        console.error("Error loading profile data:", e);
        setError("Could not load this user's profile. It may not exist or an error occurred.");
      } finally {
        // This will run regardless of success or failure, ensuring the loading state is always turned off.
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOwnProfile, ownProfile, authLoading]);

  // Loading State UI
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (isOwnProfile && ownProfile && !ownProfile.is_onboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-medical flex items-center justify-center py-20 px-4">
          <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Your Profile is Incomplete</AlertTitle>
            <AlertDescription>
              Please complete your profile to view it and access all of AIMedNet's features.
              <Button asChild className="mt-4 w-full">
                <Link to="/complete-profile">Complete Your Profile Now</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // Error State UI
  if (error) {
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

  // Profile Not Found UI
  if (!profileData) {
    return (
       <div className="min-h-screen bg-background">
        <Header />
        <main className="container-medical flex items-center justify-center py-20 px-4">
           <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>
              {isOwnProfile 
                ? "Your profile could not be loaded. Try completing it first." 
                : "This user's profile could not be found."}
               {isOwnProfile && <Button asChild className="mt-4"><Link to="/complete-profile">Complete Your Profile</Link></Button>}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Main Profile View (No changes here)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8 px-4">
        <Card className="card-medical max-w-4xl mx-auto">
          <CardHeader className="flex flex-col sm:flex-row items-start gap-6 p-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50">
              <AvatarImage src={profileData.profile_picture_url} alt={profileData.full_name} />
              <AvatarFallback className="text-4xl">
                {profileData.full_name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">{profileData.full_name}</CardTitle>
                  <CardDescription className="text-lg capitalize mt-1">
                    {profileData.user_role}
                  </CardDescription>
                </div>
                {isOwnProfile && (
                  <Button asChild variant="outline">
                    <Link to="/complete-profile">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mt-4">{profileData.bio || "No bio provided."}</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Details</h3>
                <div className="space-y-4">
                  <DetailItem icon={Briefcase} label="Position" value={profileData.current_position} />
                  <DetailItem icon={Building} label="Organization" value={profileData.organization} />
                  <DetailItem icon={Award} label="Specialization" value={profileData.specialization} />
                  <DetailItem icon={MapPin} label="Location" value={profileData.current_location} />
                  <DetailItem icon={Calendar} label="Experience" value={profileData.years_experience} />
                  {isOwnProfile && (
                    <>
                      <Separator />
                      <DetailItem icon={Mail} label="Email" value={profileData.email} />
                      <DetailItem icon={Phone} label="Phone" value={profileData.phone} />
                      <DetailItem icon={LinkIcon} label="Resume/CV" value={profileData.resume_url} isLink />
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map(skill => <Badge key={skill}>{skill}</Badge>)
                  ) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                </div>
                <h3 className="font-semibold text-lg mb-4">Education</h3>
                <div className="space-y-4 mb-6">
                   <DetailItem icon={GraduationCap} label={profileData.course || "Education"} value={`${profileData.institution} (${profileData.year_of_study})`}/>
                </div>
                <h3 className="font-semibold text-lg mb-4">Work Experience</h3>
                <div className="space-y-4">
                    {profileData.work_experience && (profileData.work_experience as WorkExperience[]).length > 0 ? (
                        (profileData.work_experience as WorkExperience[]).map((exp, index) => (
                            <div key={index} className="flex items-start">
                                <Briefcase className="h-5 w-5 text-muted-foreground mt-1 mr-4 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{exp.title}</p>
                                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                                    <p className="text-xs text-muted-foreground">{exp.years}</p>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-sm text-muted-foreground">No work experience listed.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

// --- (Helper components DetailItem and ProfileSkeleton remain unchanged) ---

const DetailItem = ({ icon: Icon, label, value, isLink = false }: { icon: React.ElementType, label: string, value?: string | null, isLink?: boolean }) => {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 mr-4 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLink ? 
          <a href={value} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">{value}</a> : 
          <p className="font-medium">{value}</p>
        }
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
    <div className="min-h-screen bg-background">
    <Header />
    <main className="container-medical py-8 px-4">
      <Card className="card-medical max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start gap-6 p-6">
          <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
          <div className="flex-grow space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/3 mt-6" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
    <Footer />
  </div>
);

export default ProfilePage;
