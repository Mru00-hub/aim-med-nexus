// src/pages/community/ThreadDetailPage.tsx

import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page
import { useEffect, useState } from 'react';
import { getThreadDetails, updateThreadDetails, getViewerRoleForSpace, Thread, Enums } from '@/integrations/supabase/community.api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Loader2 } from 'lucide-react';

type ThreadDetails = {
  title: string;
  description: string | null;
  spaceName: string | null;
  spaceId: string | null;
  creator_id: string;
};

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth(); // Get the current user
  const { toast } = useToast();
  const [threadDetails, setThreadDetails] = useState<ThreadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Enums<'membership_role'> | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDetails = async () => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const data = await getThreadDetails(threadId);
      if (data) {
        const details = {
          title: data.title,
          description: data.description,
          spaceName: data.spaces?.name || 'Public Thread',
          spaceId: data.space_id, 
          creator_id: data.creator_id,
        };
        setThreadDetails(details);
        // Pre-fill the edit form fields
        setEditedTitle(details.title);
        setEditedDescription(details.description || '');
      }
    } catch (error) {
      console.error("Failed to fetch thread details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [threadId]);

  useEffect(() => {
    const fetchUserRole = async () => {
      // We only fetch if the thread is in a space
      if (threadDetails?.spaceId && user) {
        try {
          const role = await getViewerRoleForSpace(threadDetails.spaceId);
          setUserRole(role);
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setUserRole(null); // Reset on error
        }
      }
    };

    if (threadDetails) {
      fetchUserRole();
    }
  }, [threadDetails, user]);

  const handleSaveEdit = async () => {
    if (!threadId || !editedTitle.trim()) {
        toast({ title: "Title cannot be empty.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        await updateThreadDetails(threadId, {
            title: editedTitle,
            description: editedDescription,
        });
        toast({ title: "Success!", description: "Thread updated." });
        setIsEditing(false);
        await fetchDetails(); // Refresh the details after saving
    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const canEdit = threadDetails && user && (
    user.id === threadDetails.creator_id || // User is the creator
    userRole === 'ADMIN' ||                  // User is an Admin of the space
    userRole === 'MODERATOR'                 // User is a Moderator of the space
  );

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-grow w-full flex flex-col py-4 px-4">
          <header>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : threadDetails ? (
              <>
                {canEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8" // Positioned for better layout
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}

                {isEditing ? (
                  // --- EDITING VIEW ---
                  <div className="space-y-4">
                     <div>
                        <label htmlFor="edit-title" className="text-sm font-medium text-muted-foreground">Title</label>
                        <Input id="edit-title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-2xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0" />
                     </div>
                     <div>
                        <label htmlFor="edit-description" className="text-sm font-medium text-muted-foreground">Description (Optional)</label>
                        <Textarea id="edit-description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} placeholder="Add an introduction..." className="mt-1" />
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                     </div>
                  </div>
                ) : (
                  // --- DISPLAY VIEW ---
                  <>
                    <p className="text-sm text-muted-foreground">{threadDetails.spaceName}</p>
                    <h1 className="text-3xl font-bold tracking-tight pr-12">{threadDetails.title}</h1> {/* Added padding-right */}
                    {threadDetails.description && (
                      <p className="mt-2 text-lg text-muted-foreground">{threadDetails.description}</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p>Thread not found.</p>
            )}
          </header>
          
          <div className="flex-1 mt-4"> {/* Added margin-top */}
            {threadId && <ThreadView threadId={threadId} />}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};
