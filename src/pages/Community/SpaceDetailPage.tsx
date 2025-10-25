// src/pages/community/SpaceDetailPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Users, Hash, Trash2, Pencil, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// --- IMPORTS ---
import { useCommunity } from '@/context/CommunityContext';
import { useSpaceThreads, useSpaceMetrics, useSpaceMemberList } from '@/hooks/useSpaceData';
import { CreateThreadForm } from './CreateThread'; 
import { ForumPostFeed } from '@/components/forums/ForumPostFeed';
import { ChatThreadList } from '@/components/forums/ChatThreadList';
import { 
  updateSpaceDetails, 
  Enums, 
  leaveSpace, 
  updateThreadDetails, 
  transferSpaceOwnership,
  deleteSpace,
} from '@/integrations/supabase/community.api';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- DATA FETCHING ---
  const { spaces, isLoadingSpaces, getMembershipStatus, refreshSpaces, updateLocalSpace } = useCommunity();
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(spaceId);
  const { memberList, isLoadingList, refreshList } = useSpaceMemberList(spaceId);

  // Find the specific space details from the global list.
  const space = useMemo(() => spaces?.find(s => s.id === spaceId), [spaces, spaceId]);

  // --- UI STATE ---
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [threadCreatedCount, setThreadCreatedCount] = useState(0);
  
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

  // --- ASYNCHRONOUS ACTIONS ---

  const handleSave = async (payload: { name: string; description?: string | null; join_level: Enums<'space_join_level'> }) => {
    if (!space) return;
    const originalSpace = { ...space };
    const optimisticSpace = { ...space, ...payload };
    updateLocalSpace(optimisticSpace); // Optimistic update
    try {
      await updateSpaceDetails(space.id, payload);
      toast({ title: "Success!", description: "Space details updated." });
      await refreshSpaces();
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      updateLocalSpace(originalSpace); // Revert
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
              <Button 
                onClick={() => user ? setShowCreateThread(true) : navigate('/login')} 
                disabled={!canCreateThread} 
              >
                <Plus className="h-4 w-4 mr-2" />
                {space.space_type === 'FORUM' ? 'Start New Post' : 'Start New Thread'}
              </Button>
            </div>
            
            {/* --- The Conditional "Chameleon" Render --- */}
            {space.space_type === 'FORUM' ? (
              <ForumPostFeed 
                spaceId={space.id} 
                onPostCreated={() => setThreadCreatedCount(c => c + 1)} 
              />
            ) : (
              <ChatThreadList 
                spaceId={space.id} 
                isUserAdminOrMod={isUserAdminOrMod}
                onThreadCreated={() => setThreadCreatedCount(c => c + 1)}
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
    </div>
  );
}
