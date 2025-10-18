// src/pages/community/SpaceDetailPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Users, Hash, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

// --- NEW IMPORTS ---
// Use centralized context and dedicated hooks for clean data management.
import { useCommunity } from '@/context/CommunityContext';
import { useSpaceThreads, useSpaceMetrics, useSpaceMemberList } from '@/hooks/useSpaceData';
import { CreateThreadForm } from './CreateThread'; 
import { updateSpaceDetails, Enums, leaveSpace, updateThreadDetails } from '@/integrations/supabase/community.api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- DATA FETCHING ---
  // 1. Get GLOBAL data from the context for efficiency.
  const { spaces, isLoadingSpaces, getMembershipStatus, refreshSpaces, updateLocalSpace } = useCommunity();
  // 2. Get LOCAL data for this page using dedicated hooks.
  const { threads, isLoadingThreads, refreshThreads } = useSpaceThreads(spaceId);
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(spaceId);
  const { memberList, isLoadingList } = useSpaceMemberList(spaceId);

  // Find the specific space details from the global list.
  const space = useMemo(() => spaces.find(s => s.id === spaceId), [spaces, spaceId]);

  // --- UI STATE ---
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedJoinLevel, setEditedJoinLevel] = useState<Enums<'space_join_level'>>('OPEN');
  const [editingThread, setEditingThread] = useState<any | null>(null);

  // --- LOGIC & EFFECTS ---
  // The initial page load is dependent on fetching the list of all spaces.
  const loading = isLoadingSpaces || !spaceId;

  // Memoized permission check for creating threads.
  const canCreateThread = useMemo(() => {
    if (!user || !space) return false;
    // Allow anyone to post in an open forum.
    if (space.space_type === 'FORUM' && space.join_level === 'OPEN') return true;
    // Otherwise, user must be a member of the space.
    return getMembershipStatus(space.id) === 'ACTIVE';
  }, [user, space, getMembershipStatus]);

  // Memoized check to find the current user's role in this space.
  const currentUserMembership = useMemo(() => {
    if (!user || !memberList) return null;
    return memberList.find(member => member.id === user.id);
  }, [user, memberList]);
  
  // Memoized permission check for administrative actions.
  const isUserAdminOrMod = useMemo(() => {
    return currentUserMembership?.role === 'ADMIN' || currentUserMembership?.role === 'MODERATOR';
  }, [currentUserMembership]);

  const getRoleBadgeVariant = (role: 'ADMIN' | 'MODERATOR' | 'MEMBER') => {
      switch (role) {
          case 'ADMIN': return 'destructive';
          case 'MODERATOR': return 'default';
          default: return 'secondary';
      }
  };
  
  // Effect to redirect if the space doesn't exist after loading is complete.
  useEffect(() => {
      if (!isLoadingSpaces && !space) {
          toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist or you may not have permission to view it.' });
          navigate('/community');
      }
  }, [isLoadingSpaces, space, navigate, toast]);

  useEffect(() => {
    if (space) {
        setEditedName(space.name);
        setEditedDescription(space.description || '');
        setEditedJoinLevel(space.join_level);
    }
  }, [space]);

  // --- ASYNCHRONOUS ACTIONS ---

  const handleSave = async () => {
      if (!space || !editedName.trim()) {
          toast({ title: "Name cannot be empty.", variant: "destructive" });
          return;
      }
      const originalSpace = { ...space };
      const optimisticSpace = {
          ...space,
          name: editedName,
          description: editedDescription,
          join_level: editedJoinLevel,
      };
      updateLocalSpace(optimisticSpace);
      setIsEditing(false); // Close the edit form right away
      setIsSaving(true); 
      try {
          await updateSpaceDetails(space.id, {
              name: editedName,
              description: editedDescription,
              join_level: editedJoinLevel,
          });
          toast({ title: "Success!", description: "Space details updated." });
        // NOTE: Ensure your CommunityContext provides this refresh function
          refreshSpaces();
      } catch (error: any) {
          toast({ title: "Update Failed", description: error.message, variant: "destructive" });
          updateLocalSpace(originalSpace);
          setIsEditing(true); // Re-open the form so the user can fix the issue

      } finally {
        // 9. Stop the loading indicator
          setIsSaving(false);
      }
  };

  const handleDeleteSpace = async () => {
      if (!space) return;

      try {
          const { error } = await supabase
              .from('spaces')
              .delete()
              .eq('id', space.id);

          if (error) throw error;

          toast({ title: "Success", description: "Space has been deleted." });
          navigate('/community'); // Navigate away from the now-deleted page.
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Deletion Failed",
              description: error.message || "An unexpected error occurred.",
          });
      }
  };

  const handleDeleteThread = async (threadId: string) => {
      try {
          const { error } = await supabase
              .from('threads')
              .delete()
              .eq('id', threadId);

          if (error) throw error;

          toast({ title: "Success", description: "Thread has been deleted." });
          refreshThreads(); // Refresh the list of threads after deletion.
      } catch (error: any) {
           toast({
              variant: "destructive",
              title: "Deletion Failed",
              description: error.message || "An unexpected error occurred.",
          });
      }
  };

  const handleUpdateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread) return;

    // Get data from the form
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!title) {
        toast({ title: "Title cannot be empty", variant: "destructive" });
        return;
    }
    
    try {
        await updateThreadDetails(editingThread.id, {
            title,
            description,
        });
        toast({ title: "Success", description: "Thread updated." });
        refreshThreads(); // Refresh the list
        setEditingThread(null); // Close the dialog
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred.",
        });
    }
  };

  const handleLeaveSpace = async () => {
    if (!space) return;

    try {
        await leaveSpace(space.id);
        toast({ title: "You have left the space", description: `You are no longer a member of ${space.name}.` });
        await refreshSpaces(); // This will re-fetch memberships
        navigate('/community'); // Navigate back to the main list
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Failed to leave",
            description: error.message || "An unexpected error occurred.",
        });
    }
  };
  
  // --- RENDER LOGIC ---

  const ThreadList = () => (
    <div className="space-y-4">
      {isLoadingThreads ? (
        <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </>
      ) : threads.length > 0 ? (
        threads.map(thread => (
          const canManageThread = isUserAdminOrMod || user?.id === thread.creator_id;
          
          return (
            <Card key={thread.id} className="transition-all hover:shadow-md group">
              <CardContent className="p-4 flex items-center justify-between">
                <Link to={`/community/thread/${thread.id}`} className="flex-grow">
                    <h3 className="font-semibold text-lg group-hover:text-primary">{thread.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {thread.message_count} messages • Started by {thread.creator_full_name}
                    </p>
                </Link>

                {/* This block now checks the correct permission */}
                {canManageThread && (
                  <div className="flex items-center ml-4 flex-shrink-0">
                    {/* 1. NEW "Edit" BUTTON */}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingThread(thread); // Open the edit dialog
                      }}
                    >
                       <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>

                    {/* 2. EXISTING "Delete" BUTTON */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                               <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the thread "{thread.title}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteThread(thread.id)}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>No threads have been started in this space yet.</p>
                <Button 
                    variant="link" 
                    onClick={() => canCreateThread ? setShowCreateThread(true) : navigate('/login')} 
                    className="mt-2"
                >
                    {user ? "Be the first to start one!" : "Log in to start a discussion!"}
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto py-8 px-4 flex-grow">
        {loading ? (
            <Skeleton className="h-40 w-full mb-8" />
        ) : space ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                {isEditing ? (
                  // --- EDITING VIEW ---
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Editing Space Details</h3>
                    <div>
                        <label htmlFor="edit-name" className="text-sm font-medium text-muted-foreground">Space Name</label>
                        <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-2xl h-auto p-0 border-0 shadow-none focus-visible:ring-0" />
                    </div>
                    <div>
                        <label htmlFor="edit-desc" className="text-sm font-medium text-muted-foreground">Description</label>
                        <Textarea id="edit-desc" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} placeholder="What is this space about?" className="mt-1" />
                    </div>
                    <div>
                        <label htmlFor="edit-join" className="text-sm font-medium text-muted-foreground">Join Level</label>
                        <Select value={editedJoinLevel} onValueChange={(v: Enums<'space_join_level'>) => setEditedJoinLevel(v)}>
                          <SelectTrigger className="w-[180px] mt-1">
                            <SelectValue placeholder="Select join level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                        </Button>
                    </div>
                  </div>
                ) : (
                  // --- DISPLAY VIEW ---
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-3xl">{space.name}</CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap mt-2">
                          <span>{space.description}</span>
                          <Badge variant={space.join_level === 'INVITE_ONLY' ? 'secondary' : 'default'}>
                            {space.join_level.replace('_', ' ')}
                          </Badge>
                        </div>
                    </div>
                    {isUserAdminOrMod && (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {/* NEW: Edit Button */}
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the <strong>{` ${space.name} `}</strong> space and all of its threads and messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteSpace}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                      ) : isMember ? (
                        // If they are a member BUT NOT an admin, show "Leave Space"
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">Leave Space</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You will lose access to this space and its private threads. You may need to request to join again later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleLeaveSpace}>
                                Leave Space
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null} 
                      {/* If not an admin/mod and not a member, no button shows (which is correct) */}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground border-t">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        <Link to={`/community/space/${space.id}/members`} className="hover:underline">
                            {isLoadingMetrics ? <Skeleton className="h-4 w-24 inline-block" /> : <span>{memberCount} Members</span>}
                        </Link>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Hash className="h-4 w-4 text-primary" />
                        {isLoadingMetrics ? <Skeleton className="h-4 w-24 inline-block" /> : <span>{threadCount} Threads</span>}
                    </div>
                  </div>
                  {memberList.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-base mb-3">Key Members</h4>
                        {isLoadingList ? (
                          <Skeleton className="h-6 w-full" />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {/* 1. Filter to show only Admins and Mods */}
                            {memberList
                              .filter(member => member.role === 'ADMIN' || member.role === 'MODERATOR')
                              .slice(0, 5) 
                              .map(member => (
                                <Link to={`/profile/${member.id}`} key={member.id}>
                                  <Badge
                                    variant={getRoleBadgeVariant(member.role)}
                                    className="hover:opacity-80 transition-opacity"
                                  >
                                    {member.full_name}
                                    <span className="ml-1.5 opacity-75">({member.role.slice(0, 1)})</span>
                                  </Badge>
                                </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2"><Hash className="h-6 w-6" />Threads</h2>
              <Button onClick={() => user ? setShowCreateThread(true) : navigate('/login')} disabled={!canCreateThread} title={!canCreateThread && user ? "You must be a member to start a thread here." : "Start a new discussion."}>
                <Plus className="h-4 w-4 mr-2" />Start New Thread
              </Button>
            </div>
            
            <ThreadList />
          </>
        ) : (
            <div className="text-center py-16"><p className="text-lg text-muted-foreground">Space not found.</p></div>
        )}
      </main>
      <Footer />

      {/* FIX: Conditionally render the Dialog only when 'space' exists to prevent runtime errors. */}
      {space && (
        <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Thread in {space.name}</DialogTitle>
              <DialogDescription>
                  {space.join_level === 'INVITE_ONLY' ? 'This thread will only be visible to members of this private space.' : 'This thread will be visible to all community members.'}
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              {/* FIX: Pass the guaranteed 'space.id' instead of the potentially unsafe 'spaceId'. */}
              <CreateThreadForm 
                spaceId={space.id} 
                onThreadCreated={(newThreadId) => {
                  setShowCreateThread(false);
                  refreshThreads();
                  navigate(`/community/thread/${newThreadId}`);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={!!editingThread} onOpenChange={(isOpen) => !isOpen && setEditingThread(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateThread} className="pt-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={editingThread?.title} 
                required 
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingThread?.description || ''}
                placeholder="A brief description of this thread..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingThread(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
