import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// 🚀 NEW: Removed direct supabase client import
// import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
// 🚀 NEW: Import the API functions and types we need
import {
  getProfileDetails,
  toggleFollow,
  PublicPost,
  Space,
} from '@/integrations/supabase/community.api';
import { supabase } from '@/integrations/supabase/client'; // Keep this for the RPC

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
// 🚀 NEW: Import new icons and components
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Award,
  Calendar,
  GraduationCap,
  Link as LinkIcon,
  AlertCircle,
  Users,
  CheckCircle,
  BookOpen,
  Loader2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Plus,
  ThumbsUp,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast'; // 🚀 NEW: For feedback
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'; // 🚀 NEW: For activity section

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

// 🚀 NEW: Type for the extra data we'll fetch
type ProfileActivity = {
  posts: PublicPost[];
  spaces: Space[];
};

type FollowStatus = {
  followers_count: number;
  following_count: number;
  is_followed_by_viewer: boolean;
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: ownProfile, loading: authLoading } = useAuth();
  const { toast } = useToast(); // 🚀 NEW: Toast hook

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  // 🚀 NEW: State for posts, spaces, and follow status
  const [activity, setActivity] = useState<ProfileActivity | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false); // 🚀 NEW

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || (user && user.id === userId);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setProfileData(null); // 🚀 NEW: Reset all data on new fetch
      setActivity(null);
      setFollowStatus(null);

      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        if (!authLoading) {
          setError('Could not determine which profile to load.');
          setLoading(false);
        }
        return;
      }

      try {
        // --- Step 1: Fetch the privacy-aware base profile (your existing logic) ---
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'get_profile_with_privacy',
          {
            profile_id: targetUserId,
            viewer_id: user?.id || null, // Pass current user's ID or null
          }
        );

        if (rpcError) throw rpcError;
        const profile = rpcData?.[0];

        if (profile) {
          setProfileData(profile as any);
        } else {
          throw new Error(
            'Profile not found or you do not have permission to view it.'
          );
        }

        // --- 🚀 NEW: Step 2: Fetch posts, spaces, and follow status in parallel ---
        const [
          { data: posts, error: postsError },
          { data: spaces, error: spacesError },
          { count: followersCount, error: followersError },
          { count: followingCount, error: followingError },
          { data: isFollowingData, error: isFollowingError },
        ] = await Promise.all([
          supabase
            .from('public_posts_feed')
            .select('*')
            .eq('author_id', targetUserId)
            .order('created_at', { ascending: false }),
          supabase
            .from('spaces')
            .select('*')
            .eq('creator_id', targetUserId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('followed_id', targetUserId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', targetUserId),
          user?.id // Only check follow status if viewer is logged in
            ? supabase
                .from('user_follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('followed_id', targetUserId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }), // Return empty if logged out
        ]);

        // (Optional) You could check for errors here
        if (postsError || spacesError || followersError) {
          console.warn('Could not load full profile activity');
        }

        // Set the new state
        setActivity({
          posts: posts || [],
          spaces: spaces || [],
        });
        setFollowStatus({
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
          is_followed_by_viewer: !!isFollowingData,
        });
      } catch (e: any) {
        console.error('Error loading profile data:', e);
        setError(
          "Could not load this user's profile. It may not exist or an error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [userId, user, authLoading]); // user dependency is correct

  // 🚀 NEW: Handle Follow/Unfollow
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You must be logged in to follow users.',
        variant: 'destructive',
      });
      return;
    }
    if (!profileData || !followStatus) return;

    setIsFollowLoading(true);

    // Optimistic update
    const wasFollowing = followStatus.is_followed_by_viewer;
    setFollowStatus({
      ...followStatus,
      is_followed_by_viewer: !wasFollowing,
      followers_count: wasFollowing
        ? followStatus.followers_count - 1
        : followStatus.followers_count + 1,
    });

    try {
      await toggleFollow(profileData.id); // API call
      toast({
        title: wasFollowing ? 'Unfollowed' : 'Followed!',
      });
    } catch (e: any) {
      // Rollback on error
      setFollowStatus({
        ...followStatus,
        is_followed_by_viewer: wasFollowing,
        followers_count: wasFollowing
          ? followStatus.followers_count + 1
          : followStatus.followers_count - 1,
      });
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  // ... (Your existing is_onboarded, error, and !profileData checks are all perfect) ...
  if (isOwnProfile && profileData && !profileData.is_onboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center py-20">
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
        <main className="flex items-center justify-center py-20">
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
        <main className="flex items-center justify-center py-20">
          <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>
              {isOwnProfile
                ? 'Your profile could not be loaded. Try completing it first.'
                : "This user's profile could not be found."}
              {isOwnProfile && (
                <Button asChild className="mt-4">
                  <Link to="/complete-profile">Complete Your Profile</Link>
                </Button>
              )}
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
      <main className="py-8">
        <Card className="card-medical max-w-4xl mx-auto">
          {/* ✅ ENHANCED HEADER */}
          <CardHeader className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/50 shadow-lg">
              <AvatarImage
                src={profileData.profile_picture_url || undefined}
                alt={profileData.full_name || ''}
              />
              <AvatarFallback className="text-4xl">
                {profileData.full_name?.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow w-full">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 sm:gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl">
                      {profileData.full_name}
                    </CardTitle>
                    {profileData.is_verified && (
                      <CheckCircle
                        className="h-6 w-6 text-primary"
                        title="Verified Profile"
                      />
                    )}
                  </div>
                  <div className="text-lg capitalize mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="text-sm">
                      {profileData.user_role}
                    </Badge>
                    {/* 🚀 NEW: Follower/Following Counts */}
                    {followStatus && (
                      <>
                        <Badge variant="outline" className="text-sm">
                          {followStatus.followers_count} Followers
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          {followStatus.following_count} Following
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {/* 🚀 NEW: Follow/Unfollow Button Logic */}
                <div className="flex w-full sm:w-auto gap-2">
                  {isOwnProfile ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      <Link to="/complete-profile">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </Button>
                  ) : (
                    user &&
                    followStatus && (
                      <Button
                        variant={
                          followStatus.is_followed_by_viewer
                            ? 'outline'
                            : 'default'
                        }
                        className="w-full sm:w-auto flex-shrink-0"
                        onClick={handleFollow}
                        disabled={isFollowLoading}
                      >
                        {isFollowLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : followStatus.is_followed_by_viewer ? (
                          <UserCheck className="mr-2 h-4 w-4" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {followStatus.is_followed_by_viewer
                          ? 'Following'
                          : 'Follow'}
                      </Button>
                    )
                  )}
                </div>
              </div>
              {/* ✅ PROFESSIONAL HEADLINE */}
              {(profileData.current_position || profileData.organization) && (
                <div className="mt-3 text-base font-medium">
                  {profileData.current_position}
                  {profileData.current_position &&
                    profileData.organization &&
                    ' @ '}
                  {profileData.organization}
                </div>
              )}
              {/* ✅ BIO */}
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {profileData.bio || 'No bio provided.'}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Separator className="my-6" />

            {/* 🚀 NEW: Activity Section */}
            {activity && (
              <>
                <h3 className="font-semibold text-lg mb-4">Activity</h3>
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="posts">
                      Posts ({activity.posts.length})
                    </TabsTrigger>
                    <TabsTrigger value="spaces">
                      Spaces Created ({activity.spaces.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="posts" className="mt-4">
                    {activity.posts.length > 0 ? (
                      <div className="space-y-4">
                        {activity.posts.map((post) => (
                          <PostItemCard key={post.thread_id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        This user hasn't made any public posts yet.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="spaces" className="mt-4">
                    {activity.spaces.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activity.spaces.map((space) => (
                          <SpaceItemCard key={space.id} space={space} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        This user hasn't created any spaces yet.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
                <Separator className="my-6" />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ✅ LEFT COLUMN */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Professional Details
                </h3>
                <div className="space-y-4">
                  <DetailItem
                    icon={Briefcase}
                    label="Current Position"
                    value={profileData.current_position}
                  />
                  <DetailItem
                    icon={Building}
                    label="Organization"
                    value={profileData.organization}
                  />
                  <DetailItem
                    icon={Award}
                    label="Specialization"
                    value={profileData.specialization}
                  />
                  <DetailItem
                    icon={MapPin}
                    label="Location"
                    value={profileData.current_location}
                  />
                  <DetailItem
                    icon={Calendar}
                    label="Experience"
                    value={profileData.years_experience}
                  />
                  {profileData.age && (
                    <DetailItem
                      icon={Calendar}
                      label="Age"
                      value={`${profileData.age} years`}
                    />
                  )}
                  <DetailItem
                    icon={Award}
                    label="Medical License"
                    value={profileData.medical_license}
                  />
                </div>

                {/* ✅ CONTACT INFO SECTION */}
                <Separator className="my-6" />
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <DetailItem
                    icon={Mail}
                    label="Email"
                    value={profileData.email}
                  />
                  <DetailItem
                    icon={Phone}
                    label="Phone"
                    value={profileData.phone}
                  />
                  <DetailItem
                    icon={LinkIcon}
                    label="Resume/CV"
                    value={profileData.resume_url}
                    isLink
                  />
                </div>
              </div>

              {/* ✅ RIGHT COLUMN */}
              <div>
                {/* ✅ SKILLS SECTION */}
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto pr-2">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills listed.
                    </p>
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
                          <p className="font-semibold">
                            {profileData.course || 'Course'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {profileData.institution}
                          </p>
                          {profileData.year_of_study && (
                            <Badge variant="outline" className="mt-2">
                              {profileData.year_of_study}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No education details provided.
                    </p>
                  )}
                </div>

                <Separator className="my-6" />

                {/* ✅ WORK EXPERIENCE SECTION */}
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {profileData.work_experience &&
                  (profileData.work_experience as WorkExperience[]).length >
                    0 ? (
                    (profileData.work_experience as WorkExperience[]).map(
                      (exp, index) => (
                        <div
                          key={index}
                          className="bg-muted/30 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Briefcase className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">{exp.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {exp.company}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {exp.years}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No work experience listed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ PROFILE METADATA (Footer) */}
            <Separator className="my-6" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Member since{' '}
                {new Date(profileData.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>
                Last updated{' '}
                {new Date(profileData.updated_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

// 🚀 NEW: Card component for displaying a post in the activity feed
const PostItemCard: React.FC<{ post: PublicPost }> = ({ post }) => (
  <Card className="transition-all hover:shadow-md">
    <CardContent className="p-4">
      <Link to={`/community/thread/${post.thread_id}`}>
        <h4 className="font-semibold text-base mb-2 hover:text-primary">
          {post.title}
        </h4>
      </Link>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {post.description || 'No description provided.'}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> {post.total_reaction_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" /> {post.comment_count}
        </span>
        <span>
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
    </CardContent>
  </Card>
);

// 🚀 NEW: Card component for displaying a space in the activity feed
const SpaceItemCard: React.FC<{ space: Space }> = ({ space }) => (
  <Card className="transition-all hover:shadow-md">
    <CardContent className="p-4">
      <Badge variant={space.space_type === 'FORUM' ? 'secondary' : 'outline'} className="mb-2">
        {space.space_type === 'FORUM' ? 'Forum' : 'Space'}
      </Badge>
      <Link to={`/community/space/${space.id}`}>
        <h4 className="font-semibold text-base mb-1 hover:text-primary">
          {space.name}
        </h4>
      </Link>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {space.description || 'No description.'}
      </p>
    </CardContent>
  </Card>
);

// ✅ UPDATED DetailItem Component
const DetailItem = ({
  icon: Icon,
  label,
  value,
  isLink = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  isLink?: boolean;
}) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
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
    <main className="py-8">
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
