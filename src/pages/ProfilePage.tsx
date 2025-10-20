import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, Mail, Phone, MapPin, Briefcase, Building, Award, Calendar, 
  GraduationCap, Link as LinkIcon, AlertCircle, Users, CheckCircle, BookOpen 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ProfileData = Tables<'profiles'> & {
  age?: number;
  current_location: string | null;
  institution: string | null;
  course: string | null;
  specialization: string | null;
  year_of_study: string | null;
  years_experience: string | null;
};

type WorkExperience = {
  title: string;
  company: string;
  years: string;
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: ownProfile, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || (user && user.id === userId);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        if (!authLoading) {
          setError("Could not determine which profile to load.");
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_profile_with_privacy', {
          profile_id: targetUserId,
          viewer_id: user?.id || null // Pass current user's ID or null if not logged in
        });
        
        if (rpcError) throw rpcError;
        if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw rpcError;
        }
        
        const profile = data?.[0]; 

        if (profile) {
          setProfileData(profile as any);
        } else {
          throw new Error("Profile not found or you do not have permission to view it.");
        }
      } catch (e: any) {
        console.error("Error loading profile data:", e);
        setError("Could not load this user's profile. It may not exist or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [userId, user, authLoading]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (isOwnProfile && profileData && !profileData.is_onboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-medical flex items-center justify-center py-20 px-4">
          <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Your Profile is Incomplete</AlertTitle>
            <AlertDescription>
              Please complete your profile to view it and access all features.
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
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8 px-4">
        <Card className="card-medical max-w-4xl mx-auto">
          {/* ✅ ENHANCED HEADER */}
          <CardHeader className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50 shadow-lg">
              <AvatarImage src={profileData.profile_picture_url || undefined} alt={profileData.full_name || ''} />
              <AvatarFallback className="text-4xl">
                {profileData.full_name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl">{profileData.full_name}</CardTitle>
                    {/* ✅ VERIFIED BADGE */}
                    {profileData.is_verified && (
                      <CheckCircle className="h-6 w-6 text-primary" title="Verified Profile" />
                    )}
                  </div>
                  <div className="text-lg capitalize mt-1 flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="text-sm">
                      {profileData.user_role}
                    </Badge>
                    {/* ✅ CONNECTION COUNT */}
                    {profileData.connection_count > 0 && (
                      <Badge variant="outline" className="text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        {profileData.connection_count} Connections
                      </Badge>
                    )}
                  </div>
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
              {/* ✅ PROFESSIONAL HEADLINE */}
              {(profileData.current_position || profileData.organization) && (
                <div className="mt-3 text-base font-medium">
                  {profileData.current_position}
                  {profileData.current_position && profileData.organization && ' @ '}
                  {profileData.organization}
                </div>
              )}
              {/* ✅ BIO */}
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {profileData.bio || "No bio provided."}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ✅ LEFT COLUMN */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Professional Details
                </h3>
                <div className="space-y-4">
                  <DetailItem icon={Briefcase} label="Current Position" value={profileData.current_position} />
                  <DetailItem icon={Building} label="Organization" value={profileData.organization} />
                  <DetailItem icon={Award} label="Specialization" value={profileData.specialization} />
                  <DetailItem icon={MapPin} label="Location" value={profileData.current_location} />
                  <DetailItem icon={Calendar} label="Experience" value={profileData.years_experience} />
                  {/* ✅ AGE DISPLAY */}
                  {profileData.age && (
                    <DetailItem icon={Calendar} label="Age" value={`${profileData.age} years`} />
                  )}
                  {/* ✅ MEDICAL LICENSE */}
                  <DetailItem icon={Award} label="Medical License" value={profileData.medical_license} />
                </div>

                {/* ✅ CONTACT INFO SECTION */}
                <Separator className="my-6" />
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <DetailItem icon={Mail} label="Email" value={profileData.email} />
                  <DetailItem icon={Phone} label="Phone" value={profileData.phone} />
                  <DetailItem icon={LinkIcon} label="Resume/CV" value={profileData.resume_url} isLink />
                </div>
              </div>

              {/* ✅ RIGHT COLUMN */}
              <div>
                {/* ✅ SKILLS SECTION */}
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills listed.</p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* ✅ EDUCATION SECTION */}
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Education
                </h3>
                <div className="space-y-4 mb-6">
                  {profileData.institution ? (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">{profileData.course || "Course"}</p>
                          <p className="text-sm text-muted-foreground">{profileData.institution}</p>
                          {profileData.year_of_study && (
                            <Badge variant="outline" className="mt-2">
                              {profileData.year_of_study}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No education details provided.</p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* ✅ WORK EXPERIENCE SECTION */}
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {profileData.work_experience && (profileData.work_experience as WorkExperience[]).length > 0 ? (
                    (profileData.work_experience as WorkExperience[]).map((exp, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Briefcase className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            <p className="text-xs text-muted-foreground mt-1">{exp.years}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No work experience listed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ PROFILE METADATA (Footer) */}
            <Separator className="my-6" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Member since {new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <span>Last updated {new Date(profileData.updated_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

// ✅ UPDATED DetailItem Component
const DetailItem = ({ 
  icon: Icon, 
  label, 
  value, 
  isLink = false 
}: { 
  icon: React.ElementType, 
  label: string, 
  value?: string | null, 
  isLink?: boolean 
}) => {
  if (!value) return null;
  
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        {isLink ? (
          <a 
            href={value.startsWith('http') ? value : `https://${value}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-medium text-primary hover:underline break-all text-sm"
          >
            {value}
          </a>
        ) : (
          <p className="font-medium text-sm mt-1">{value}</p>
        )}
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
