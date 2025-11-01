// src/pages/community/SpaceDetailPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Hash, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// --- IMPORTS ---
import { useCommunity } from '@/context/CommunityContext';
import { useSpaceMetrics, useSpaceMemberList } from '@/hooks/useSpaceData';
import { CreateThreadForm } from './CreateThread'; 
import { SpaceHeader } from '@/components/forums/SpaceHeader';
import { ForumPostFeed } from '@/components/forums/ForumPostFeed';
import { ChatThreadList } from '@/components/forums/ChatThreadList';
import { 
  updateSpaceDetails, 
  Enums, 
  leaveSpace, 
  transferSpaceOwnership,
  deleteSpace,
  getSpaceDetails, // 🚀 ADDED
  SpaceWithDetails 
} from '@/integrations/supabase/community.api';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- DATA FETCHING ---
  const { getMembershipStatus, refreshSpaces } = useCommunity();
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(spaceId);
  const { memberList, isLoadingList, refreshList } = useSpaceMemberList(spaceId);
  const [space, setSpace] = useState<SpaceWithDetails | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);

  // --- UI STATE ---
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [threadCreatedCount, setThreadCreatedCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  // --- LOGIC & EFFECTS ---
  const loading = isLoadingSpaces || !spaceId;

  const currentUserMembership = useMemo(() => {
    if (!user || !memberList) return null;
    return memberList.find(member => member.id === user.id);
  }, [user, memberList]);
  
  const isUserAdminOrMod = useMemo(() => {
    return currentUserMembership?.role === 'ADMIN' || currentUserMembership?.role === 'MODERATOR';
  }, [currentUserMembership]);

  const isUserCreator = useMemo(() => {
    return user && space && user.id === space.creator_id;
  }, [user, space]);

  const canCreateThread = useMemo(() => {
    if (!user || !space) return false;
    if (space.space_type === 'FORUM') return true; // Anyone can post in a forum (RLS handles private)
    return getMembershipStatus(space.id) === 'ACTIVE'; // Must be member for chat
  }, [user, space, getMembershipStatus]);

  useEffect(() => {
    if (!isLoadingSpaces && !space) {
      toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist.' });
      navigate('/community');
    }
  }, [isLoadingSpaces, space, navigate, toast]);

  useEffect(() => {
    if (!spaceId) {
      navigate('/community');
      return;
    }
    
    setIsLoadingSpace(true);
    getSpaceDetails(spaceId)
      .then(data => {
        if (data) {
          // Note: getSpaceDetails returns 'Space', not 'SpaceWithDetails'.
          // We cast it here, assuming it has the necessary fields.
          // For a robust app, you'd fetch the 'SpaceWithDetails' version.
          setSpace(data as SpaceWithDetails); 
        } else {
          toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist.' });
          navigate('/community');
        }
      })
      .catch(error => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        navigate('/community');
      })
      .finally(() => {
        setIsLoadingSpace(false);
      });
  }, [spaceId, navigate, toast]);

  useEffect(() => {
    // This ensures window is accessed only on the client
    setShareUrl(window.location.href);
  }, []);
  // --- ASYNCHRONOUS ACTIONS ---

  const handleSave = async (payload: { name: string; description?: string | null; join_level: Enums<'space_join_level'> }) => {
    console.log('[SpaceDetailPage] handleSave FIRED.');
    if (!space) {
      console.error('[SpaceDetailPage] Save failed: space is null');
      return;
    }
    const originalSpace = { ...space };
    const optimisticSpace = {
      ...space,
      ...payload, // Merge the new details (name, description, etc.)
    };
    setSpace(optimisticSpace); // Optimistic update
    try {
      console.log('[SpaceDetailPage] Calling updateSpaceDetails with:', space.id, payload);
      await updateSpaceDetails(space.id, payload);
      console.log('[SpaceDetailPage] updateSpaceDetails SUCCESS.');
      toast({ title: "Success!", description: "Space details updated." });
      await refreshSpaces();
    } catch (error: any) {
      console.error('--- UPDATE FAILED ---'); // <-- ADD THIS
      console.error(error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      setSpace(originalSpace);
      throw error; // Re-throw to keep dialog open
    }
  };

  const handleDeleteSpace = async () => {
    if (!space) return;
    try {
      await deleteSpace(space.id);
      toast({ title: "Success", description: "Space has been deleted." });
      await refreshSpaces(); 
      navigate('/community');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  };

  const handleLeaveSpace = async () => {
    if (!space) return;
    try {
      await leaveSpace(space.id);
      toast({ title: "You have left the space" });
      await refreshSpaces();
      navigate('/community');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to leave", description: error.message });
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!space || !newOwnerId) return;
    try {
      await transferSpaceOwnership(space.id, newOwnerId);
      toast({ title: "Success!", description: "Ownership transferred." });
      await refreshSpaces();
      await refreshList();
    } catch (error: any) {
      toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
      throw error; // Re-throw
    }
  };

  const handleThreadCreated = (newThreadId: string) => {
    setShowCreateThread(false);
    setThreadCreatedCount(c => c + 1); // Trigger refresh in child feeds
    navigate(`/community/thread/${newThreadId}`);
  };

  const handleCreateClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (space.space_type === 'FORUM') {
    // For Forums, go to the full post creation page
      navigate(`/community/space/${space.id}/create-post`);
    } else {
    // For Community Spaces, open the simple dialog
      setShowCreateThread(true);
    }
  };

  const handleShare = () => {
    if (!space) return;

    if (navigator.share) {
      navigator.share({
        title: space.name,
        text: `Check out the ${space.name} space.`,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container-medical flex-1">
        {loading ? (
          <div className="space-y-8 mt-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : space ? (
          <>
            <SpaceHeader
              space={space}
              memberList={memberList || []}
              memberCount={memberCount}
              threadCount={threadCount}
              isLoadingMetrics={isLoadingMetrics}
              isLoadingList={isLoadingList}
              currentUserRole={currentUserMembership?.role || null}
              isUserCreator={isUserCreator}
              onSave={handleSave}
              onLeave={handleLeaveSpace}
              onDelete={handleDeleteSpace}
              onTransfer={handleTransferOwnership}
            />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Hash className="h-6 w-6" />
                {space.space_type === 'FORUM' ? 'Posts' : 'Threads'}
              </h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCreateClick}
                  disabled={!canCreateThread} 
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {space.space_type === 'FORUM' ? 'Start New Post' : 'Start New Thread'}
                </Button>
                <Button variant="outline" size="icon" title="Share Space" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* --- The Conditional "Chameleon" Render --- */}
            {space.space_type === 'FORUM' ? (
              <ForumPostFeed 
                spaceId={space.id} 
                refreshKey={threadCreatedCount} 
              />
            ) : (
              <ChatThreadList 
                spaceId={space.id} 
                isUserAdminOrMod={isUserAdminOrMod}
                refreshKey={threadCreatedCount} 
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">Space not found.</p>
          </div>
        )}
      </main>
      <Footer />

      {/* Create Thread Dialog */}
      {space && (
        <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New {space.space_type === 'FORUM' ? 'Post' : 'Thread'} in {space.name}</DialogTitle>
              <DialogDescription>
                {space.space_type === 'FORUM' 
                  ? "Start a new post. You can add attachments and format your message."
                  : "Start a new chat thread. This will be a real-time conversation."}
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <CreateThreadForm 
                spaceId={space.id} 
                onThreadCreated={handleThreadCreated}
              />
            </div>
          </DialogContent>
        </Dialog>        
      )}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this space</DialogTitle>
            <DialogDescription>
              Copy the link below to share this space.
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
    </div>
  );
}
