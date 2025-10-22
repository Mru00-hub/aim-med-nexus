// src/pages/community/ThreadDetailPage.tsx

import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page
import React, { useEffect, useState, useMemo } from 'react';
import { getThreadDetails, updateThreadDetails, getViewerRoleForSpace, Thread, Enums, getThreadSummary, SummaryResponse } from '@/integrations/supabase/community.api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Loader2, Sparkles, AlertCircle} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type ThreadDetails = {
  title: string;
  description: string | null;
  spaceName: string | null;
  spaceId: string | null;
  creator_id: string;
};

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  useEffect(() => {
    // Reset scroll position
    window.scrollTo(0, 0);
    
    // Force layout recalculation
    document.body.style.overflow = 'auto';
    
    // Clean up any lingering modals/dialogs
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => {
      if (!dialog.closest('[data-state="open"]')) {
        dialog.remove();
      }
    });
  }, [threadId]);
  
  const { user, profile } = useAuth(); // Get the current user
  const { toast } = useToast();
  const [threadDetails, setThreadDetails] = useState<ThreadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Enums<'membership_role'> | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLimit, setSummaryLimit] = useState<number>(50);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

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
    if (!threadId || !threadDetails || !editedTitle.trim()) {
        toast({ title: "Title cannot be empty.", variant: "destructive" });
        return;
    }
    const originalDetails = { ...threadDetails };
    const optimisticDetails: ThreadDetails = {
        ...threadDetails,
        title: editedTitle,
        description: editedDescription,
    };
    setThreadDetails(optimisticDetails);
    setIsEditing(false); // Close the edit form right away
    setIsSaving(true);  
    try {
        await updateThreadDetails(threadId, {
            title: editedTitle,
            description: editedDescription,
        });
        toast({ title: "Success!", description: "Thread updated." });
    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        setThreadDetails(originalDetails);
        setIsEditing(true); // Re-open the form so the user can fix the issue or retry
    } finally {
        setIsSaving(false);
    }
  };

  const canEdit = useMemo(() => {
    if (!user || !threadDetails) return false;

    // 1. User is the creator
    if (user.id === threadDetails.creator_id) {
      return true;
    }

    // 2. User is a "global" admin/mod (from their profile)
    //    This is the fix for public threads.
    if (profile?.user_role === 'ADMIN' || profile?.user_role === 'MODERATOR') {
      return true;
    }

    // 3. User is a space-specific Admin/Mod (from state)
    //    This will be 'null' for public threads, which is fine.
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return true;
    }
    
    return false;
  }, [user, profile, threadDetails, userRole]); 
  
  const handleGenerateSummary = async () => {
    if (!threadId) return;

    setIsSummarizing(true);
    setSummary(null);
    setSummaryError(null);
    
    try {
      const result = await getThreadSummary(threadId, summaryLimit);
      setSummary(result);
    } catch (error: any) {
      // Log the full error to the console for easier debugging
      console.error("Failed to generate summary:", error);

      let errorMessage = "An unknown error occurred.";

      // Check for the nested error message from your AppError
      if (error.context && error.context.error) {
        // This is a common structure for Supabase FunctionsHttpError
        errorMessage = error.context.error;
      } else if (error.data && error.data.error) {
        // Another possible structure
        errorMessage = error.data.error;
      } else if (error.error) {
        // If the error object *is* your JSON response
        errorMessage = error.error;
      } else if (error.message) {
        // Fallback to the standard error message
        errorMessage = error.message;
      }

      setSummaryError(errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  };
  
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
          {!isLoading && threadId && (
            <div className="my-4 p-4 border rounded-lg bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-lg font-semibold">AI Thread Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a quick summary of the latest messages.
                  </p>
                </div>
                
                <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(summaryLimit)}
                      onValueChange={(val) => setSummaryLimit(Number(val))}
                      disabled={isSummarizing}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Message Limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">Last 50 Messages</SelectItem>
                        <SelectItem value="75">Last 75 Messages</SelectItem>
                        <SelectItem value="100">Last 100 Messages</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DialogTrigger asChild>
                      <Button onClick={handleGenerateSummary} disabled={isSummarizing}>
                        {isSummarizing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate
                      </Button>
                    </DialogTrigger>
                  </div>

                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Thread Summary</DialogTitle>
                      <DialogDescription>
                        {isSummarizing
                          ? `Generating a summary from the last ${summaryLimit} messages...`
                          : summary
                          ? `Based on ${summary.message_count} messages (up to ${summaryLimit} analyzed).`
                          : "Your summary will appear here."}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="my-4">
                      {isSummarizing && (
                        <div className="space-y-2 flex flex-col items-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground text-center mt-4">
                            AI is thinking... this may take a moment.
                          </p>
                          <Skeleton className="h-4 w-full mt-4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      )}
                      
                      {summaryError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" /> 
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{summaryError}</AlertDescription>
                        </Alert>
                      )}

                      {summary && (
                        // Using prose for nice text formatting, max-h for scrolling
                        <div className="prose prose-sm dark:prose-invert max-h-[50vh] overflow-y-auto rounded-md border p-4">
                          <p>{summary.ai_summary.split('\n').map((line, i) => (
                            <React.Fragment key={i}>{line}<br/></React.Fragment>
                          ))}</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSummaryOpen(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
          
          <div className="flex-1 mt-4 min-h-0"> {/* Added margin-top */}
            {isLoading ? (
              // Show skeleton while main thread details are loading
              <div className="space-y-4 p-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
              </div>
            ) : threadId ? (
              <ThreadView 
                threadId={threadId} 
                // Pass the spaceId (it's okay if it's null for public threads)
                spaceId={threadDetails?.spaceId || null} 
                // Pass the final moderation permission you already calculated
                canModerate={canEdit} 
              />
            ) : (
              <p>Thread ID not found.</p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};
