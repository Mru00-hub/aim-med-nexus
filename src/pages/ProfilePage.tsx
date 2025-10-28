import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// 🚀 PLAN: Import all new API functions and types
import {
  getProfileDetails,
  toggleFollow,
  incrementProfileView,
  FullProfile, // The comprehensive type
} from '@/integrations/supabase/community.api';
import {
  getConnectionStatus,
  createOrGetConversation,
  sendConnectionRequest, // 🚀 PLAN: For 'Connect' button
} from '@/integrations/supabase/social.api';

// 🚀 PLAN: Import Layouts
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ClinicalProfileLayout } from '@/components/profile-display/ClinicalProfileLayout';
import { NonClinicalProfileLayout } from '@/components/profile-display/NonClinicalProfileLayout';

// 🚀 PLAN: Import UI Components
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { UserListModal } from '@/components/profile-display/UserListModal';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: ownProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 🚀 PLAN: State for all profile data
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  
  // 🚀 PLAN: State for button logic
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'pending_sent' | 'pending_received' | 'not_connected'>('not_connected');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);

  // 🚀 PLAN: General page state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    userId: '',
  });

  const isOwnProfile = !userId || (user && user.id === userId);
  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) {
        if (!authLoading) {
          setError('Could not determine which profile to load.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setFullProfile(null);

      try {
        // 🚀 PLAN: Call the single comprehensive API function
        const data = await getProfileDetails(targetUserId);
        setFullProfile(data);

        if (!isOwnProfile) {
          // Increment view count (fire and forget)
          incrementProfileView(targetUserId);
          
          // Fetch connection status for button logic
          const status = await getConnectionStatus(targetUserId);
          setConnectionStatus(status);
        }
      } catch (e: any) {
        console.error('Error loading full profile data:', e);
        setError("Could not load this user's profile. It may not exist or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [targetUserId, authLoading, isOwnProfile]);// targetUserId is derived, so not needed
  
  useEffect(() => {
  // This ensures window is accessed only on the client
    setShareUrl(window.location.href);
  }, []);

  // --- Button Action Handlers ---

  const handleFollow = async () => {
    if (!user) return toast({ title: 'Please log in', variant: 'destructive' });
    if (!fullProfile) return;

    setIsFollowLoading(true);
    const wasFollowing = fullProfile.is_followed_by_viewer;

    // Optimistic update
    setFullProfile(prev => prev ? ({
      ...prev,
      is_followed_by_viewer: !wasFollowing,
      followers_count: wasFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
    }) : null);

    try {
      await toggleFollow(fullProfile.profile.id);
      toast({ title: wasFollowing ? 'Unfollowed' : 'Followed!' });
    } catch (e: any) {
      // Rollback
      setFullProfile(prev => prev ? ({
        ...prev,
        is_followed_by_viewer: wasFollowing,
        followers_count: wasFollowing ? prev.followers_count + 1 : prev.followers_count - 1,
      }) : null);
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!fullProfile) return;
    try {
      const conversationId = await createOrGetConversation(fullProfile.profile.id);
      navigate(`/messages/${conversationId}`);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Could not start conversation: ${e.message}` });
    }
  };

  const handleConnect = async () => {
    if (!fullProfile) return;
    setIsConnectionLoading(true);
    try {
      await sendConnectionRequest(fullProfile.profile.id);
      setConnectionStatus('pending_sent'); // Optimistic update
      toast({ title: 'Connection request sent!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsConnectionLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${fullProfile?.profile.full_name}'s Profile`,
        text: `Check out ${fullProfile?.profile.full_name}'s professional profile.`,
        url: shareUrl, 
      }).catch((err) => console.error("Share failed", err));
    } else {
      // Fallback for desktop: show modal with link to copy
      setShowShareModal(true);
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard!" });
  };

  const handleShowList = (title: 'Followers' | 'Following' | 'Connections') => {
    if (!targetUserId) return;

    let modalTitle = title;
    
    // On *another* user's profile, clicking 'Connections' shows *Mutual* Connections
    if (!isOwnProfile && title === 'Connections') {
      modalTitle = 'Mutual Connections';
    }
    
    // On *my own* profile, clicking 'Connections' shows *My* Connections
    if (isOwnProfile && title === 'Connections') {
       modalTitle = 'Connections';
    }

    setModalState({ 
      isOpen: true, 
      title: modalTitle, 
      userId: targetUserId 
    });
  };

  // --- Render Logic ---

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (isOwnProfile && fullProfile && !fullProfile.profile.is_onboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center py-20 px-4">
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
        <main className="flex items-center justify-center py-20 px-4">
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

  if (!fullProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center py-20 px-4">
          <Alert className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>This user's profile could not be found.</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // 🚀 PLAN: This is the core dynamic logic
  const profileMode = fullProfile.profile.profile_mode;
  
  // 🚀 PLAN: Consolidate all props for layouts
  const layoutProps = {
    data: fullProfile,
    isOwnProfile,
    connectionStatus,
    isFollowLoading,
    isConnectionLoading,
    onFollow: handleFollow,
    onConnect: handleConnect,
    onMessage: handleMessage,
    onShare: handleShare,
    onShowList: handleShowList,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-0 sm:py-8">
        {/* 🚀 PLAN: Dynamic layout rendering */}
        {profileMode === 'non_clinical' ? (
          <NonClinicalProfileLayout {...layoutProps} />
        ) : (
          <ClinicalProfileLayout {...layoutProps} />
        )}
      </main>
      
      {/* 🚀 PLAN: Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this profile</DialogTitle>
            <DialogDescription>
              Copy the link below to share this profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              id="share-link"
              value={shareUrl}
              readOnly
            />
            <Button type="button" size="sm" onClick={copyShareLink}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <UserListModal
        isOpen={modalState.isOpen}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, isOpen: open }))}
        title={modalState.title}
        userId={modalState.userId}
      />
      <Footer />
    </div>
  );
};

// --- Skeleton Component ---

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="py-0 sm:py-8">
      <Card className="card-medical max-w-4xl mx-auto rounded-none sm:rounded-lg">
        {/* Skeleton Hero */}
        <CardHeader className="p-0">
          <Skeleton className="h-32 sm:h-40 w-full" />
          <div className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16 sm:-mt-20">
              <Skeleton className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-background" />
              <div className="flex-grow mt-4 sm:pb-2 space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Skeleton Body */}
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Separator className="my-6" />
          <div className="space-y-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </main>
    <Footer />
  </div>
);

export default ProfilePage;
