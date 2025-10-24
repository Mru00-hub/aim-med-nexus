// src/pages/community/ThreadDetailPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page
import { getThreadDetails,getPostDetails,updatePost, updateThreadDetails, getViewerRoleForSpace, Thread, Enums, getThreadSummary, SummaryResponse, MessageWithDetails, PublicPost,} from '@/integrations/supabase/community.api';
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
import '@/styles/page-reset.css';
import { PostAndCommentsView } from '@/components/forums/PostAndCommentsView';

type BasicThreadDetails = {
  title: string;
  description: string | null;
  spaceName: string | null;
  spaceId: string | null;
  creator_id: string;
  spaceType: 'PUBLIC' | 'FORUM' | 'COMMUNITY_SPACE' | null;
};

type FullPostDetails = {
  post: PublicPost & { attachments: any[]; reactions: any[] };
  comments: MessageWithDetails[];
};

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, profile } = useAuth(); // Get the current user
  const { toast } = useToast();
  const [basicDetails, setBasicDetails] =
    useState<BasicThreadDetails | null>(null);
  const [postDetails, setPostDetails] =
    useState<FullPostDetails | null>(null);
  const [isPublicPost, setIsPublicPost] = useState(false); // The "chameleon" switch
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Enums<'membership_role'> | null>(
    null
  );
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
    setBasicDetails(null);
    setPostDetails(null);
    setIsPublicPost(false);

    try {
      // Stage 1: Fetch basic details to know what *kind* of thread this is
      // @ts-ignore
      const data = await getThreadDetails(threadId);
      if (!data) throw new Error('Thread not found.');

      const details: BasicThreadDetails = {
        title: data.title,
        description: data.description,
        spaceName: data.spaces?.name || 'Public Post',
        spaceId: data.space_id,
        creator_id: data.creator_id,
        // @ts-ignore
        spaceType: data.spaces?.space_type || 'PUBLIC',
      };
      setBasicDetails(details);
      setEditedTitle(details.title);
      setEditedDescription(details.description || ''); 

      // Stage 2: Check if it's a public post
      if (details.spaceType === 'PUBLIC') {
        setIsPublicPost(true);
        // It's a public post, so fetch the full post/comment data
        const fullData = await getPostDetails(threadId);
        setPostDetails(fullData);
        // Sync edited fields with full data
        setEditedTitle(fullData.post.title);
      } else {
        // It's a private/forum thread.
        setIsPublicPost(false);
      }
    } catch (error: any) {
      console.error('Failed to fetch thread details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load thread.',
        variant: 'destructive',
      });
      setBasicDetails(null);
      setPostDetails(null); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'auto';
    fetchDetails();
  }, [threadId]);

  useEffect(() => {
    // Fetch user role (only for private spaces)
    const fetchUserRole = async () => {
      if (basicDetails?.spaceId && user) {
        try {
          const role = await getViewerRoleForSpace(basicDetails.spaceId);
          setUserRole(role);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole(null);
        }
      }
    };
    if (basicDetails && !isPublicPost) {
      fetchUserRole();
    }
  }, [basicDetails, user, isPublicPost]);

  const canEdit = useMemo(() => {
    if (!user || !basicDetails) return false;
    if (user.id === basicDetails.creator_id) return true;
    if (profile?.user_role === 'ADMIN' || profile?.user_role === 'MODERATOR')
      return true;
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') return true;
    return false;
  }, [user, profile, basicDetails, userRole]);

  const handleSaveEdit = async () => {
    if (!threadId || !basicDetails || !editedTitle.trim()) {
      toast({ title: 'Title cannot be empty.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    setIsEditing(false);

    try {
      if (isPublicPost) {
        // --- NEW PATH for Public Posts ---
        await updatePost(threadId, {
          title: editedTitle,
        });
        // Optimistically update the UI
        setPostDetails((prev) =>
          prev
            ? {
                ...prev,
                post: {
                  ...prev.post,
                  title: editedTitle,
                },
              }
            : null
        );
      } else {
        // --- OLD PATH for private threads ---
        await updateThreadDetails(threadId, {
          title: editedTitle,
          description: editedDescription,
        });
      }
      // Optimistically update basic details for the header
      setBasicDetails((prev) =>
        prev ? { ...prev, title: editedTitle, description: !isPublicPost ? editedDescription : prev.description  } : null
      );
      toast({ title: 'Success!', description: 'Thread updated.' });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsEditing(true); // Re-open form on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    // ... (This function is unchanged)
    if (!threadId) return;
    setIsSummarizing(true);
    setSummary(null);
    setSummaryError(null);
    try {
      const result = await getThreadSummary(threadId, summaryLimit);
      setSummary(result);
    } catch (error: any) {
      console.error("Failed to generate summary:", error);
      let errorMessage = "An unknown error occurred.";
      // @ts-ignore
      if (error.context && error.context.error) {
         // @ts-ignore
        errorMessage = error.context.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setSummaryError(errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        {/* Mobile-first container: wide for chats, centered for posts */}
        <main
          className={`flex-1 py-4 ${
            isPublicPost
              ? 'container mx-auto px-4' // Centered for posts
              : 'container-medical' // Full-width for chats
          }`}
        >
          {/* --- HEADER --- */}
          <header
            className={`relative ${
              isPublicPost ? 'max-w-3xl mx-auto' : ''
            }`}
          >
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : basicDetails ? (
              <>
                {canEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-8 w-8"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}

                {isEditing ? (
                  <div className="space-y-4 p-4 border rounded-md">
                    <div>
                      <label
                        htmlFor="edit-title"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Title
                      </label>
                      <Input
                        id="edit-title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-2xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    {!isPublicPost && (
                      <div>
                        <label
                          htmlFor="edit-description"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Description (Optional)
                        </label>
                        <Textarea
                          id="edit-description"
                          value={editedDescription}
                          onChange={(e) =>
                            setEditedDescription(e.target.value)
                          }
                          placeholder="Add an introduction..."
                          className="mt-1"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {basicDetails.spaceName}
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight pr-12">
                      {basicDetails.title}
                    </h1>
                    {basicDetails.description && !isPublicPost && (
                      <p className="mt-2 text-lg text-muted-foreground">
                        {basicDetails.description}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p>Thread not found.</p>
            )}
          </header>

          {/* --- AI SUMMARY (NOW CONDITIONAL) --- */}
          {/* CHANGED: Added !isPublicPost condition */}
          {!isLoading && threadId && !isPublicPost && (
            <div
              className={`my-4 p-4 border rounded-lg bg-card shadow-sm ${
                isPublicPost ? 'max-w-3xl mx-auto' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                      <Button
                        onClick={handleGenerateSummary}
                        disabled={isSummarizing}
                      >
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
                          : 'Your summary will appear here.'}
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
                        <div className="prose prose-sm dark:prose-invert max-h-[50vh] overflow-y-auto rounded-md border p-4">
                          <p>
                            {summary.ai_summary.split('\n').map((line, i) => (
                              <React.Fragment key={i}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsSummaryOpen(false)}
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* --- THE CHAMELEON SWITCH --- */}
          <div className="flex-1 mt-4 min-h-0">
            {isLoading ? (
              <div className="space-y-4 p-4 max-w-3xl mx-auto">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ) : threadId && basicDetails ? (
              isPublicPost && postDetails ? (
                // --- NEW: Render the Post & Comment UI ---
                <PostAndCommentsView
                  threadId={threadId}
                  postDetails={postDetails}
                  canEdit={canEdit}
                  refresh={fetchDetails}
                />
              ) : !isPublicPost ? (
                // --- OLD: Render the Slack-style Chat UI ---
                <ThreadView
                  threadId={threadId}
                  spaceId={basicDetails.spaceId || null}
                  canModerate={canEdit}
                />
              ) : (
                // Loading state for post details
                <div className="space-y-4 p-4 max-w-3xl mx-auto">
                  <Skeleton className="h-24 w-full" />
                </div>
              )
            ) : (
              <p>Thread ID not found.</p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
