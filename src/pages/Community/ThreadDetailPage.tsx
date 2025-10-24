// src/pages/community/ThreadDetailPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page
import { getThreadDetails,getPostDetails,updatePost, updateThreadDetails, getViewerRoleForSpace, Thread, Enums, getThreadSummary, SummaryResponse, postMessage, MessageWithDetails, PublicPost,toggleReaction, editMessage, deleteMessage, deletePost} from '@/integrations/supabase/community.api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useCommunity } from '@/context/CommunityContext';
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
  const navigate = useNavigate();
  const { refreshSpaces } = useCommunity(); 
  const [basicDetails, setBasicDetails] =
    useState<BasicThreadDetails | null>(null);
  const [postDetails, setPostDetails] =
    useState<FullPostDetails | null>(null);
  const [isPublicPost, setIsPublicPost] = useState(false); // The "chameleon" switch
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Enums<'membership_role'> | null>(
    null
  );
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

  const handleOptimisticReaction = (emoji: string) => {
    if (!user || !postDetails) {
      toast({ title: 'Please log in to react.' });
      return;
    }

    const currentPost = postDetails.post;
    // @ts-ignore
    const existingReaction = currentPost.reactions.find(r => r.user_id === user.id);
    let nextReactions;

    if (!existingReaction) {
      // Case 1: Add new reaction
      nextReactions = [
        ...currentPost.reactions,
        {
          message_id: currentPost.first_message_id,
          user_id: user.id,
          reaction_emoji: emoji,
          created_at: new Date().toISOString(),
          id: Math.random(),
        }
      ];
    } else if (existingReaction.reaction_emoji === emoji) {
      // Case 2: Remove existing reaction
      // @ts-ignore
      nextReactions = currentPost.reactions.filter(r => r.user_id !== user.id);
    } else {
      // Case 3: Replace existing reaction
      // @ts-ignore
      nextReactions = currentPost.reactions.filter(r => r.user_id !== user.id);
      nextReactions.push({
        message_id: currentPost.first_message_id,
        user_id: user.id,
        reaction_emoji: emoji,
        created_at: new Date().toISOString(),
        id: Math.random(),
      });
    }
  };
    
  const handleOptimisticComment = (body: string, parentMessageId: number | null = null) => {
    if (!user || !profile || !postDetails) return;

    // 1. Create a fake comment (unchanged)
    const fakeComment: MessageWithDetails = {
      id: Math.random(), 
      created_at: new Date().toISOString(),
      user_id: user.id,
      thread_id: postDetails.post.thread_id,
      body: body,
      parent_message_id: parentMessageId,
      is_edited: false,
      author: {
        full_name: profile.full_name,
        profile_picture_url: profile.profile_picture_url
      },
      reactions: [],
      attachments: []
    };

    // 2. Optimistically update the state (THIS IS THE FIX)
    setPostDetails(prev => {
      if (!prev) return null;
      return {
        ...prev,
        // ALSO update the post object itself
        post: {
          ...prev.post,
          comment_count: prev.post.comment_count + 1 
        },
        // Add the new comment to the comments array
        comments: [...prev.comments, fakeComment]
      };
    });

    // 3. Call the real API (unchanged)
    postMessage(postDetails.post.thread_id, body, parentMessageId)
      .then(() => {
        // ADDED: Refresh the main threads list on success
        refreshSpaces(); 
      })
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Failed to post', description: error.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticCommentReaction = (commentId: number, emoji: string) => {
    if (!user || !postDetails) return;

    // 1. Find the comment
    const newComments = postDetails.comments.map(c => {
      if (c.id !== commentId) return c;

      // 2. Apply same logic as post reaction
      const existingReaction = c.reactions.find(r => r.user_id === user.id);
      let nextReactions;

      if (!existingReaction) {
        nextReactions = [...c.reactions, { message_id: commentId, user_id: user.id, reaction_emoji: emoji, id: Math.random() }];
      } else if (existingReaction.reaction_emoji === emoji) {
        nextReactions = c.reactions.filter(r => r.user_id !== user.id);
      } else {
        nextReactions = c.reactions.filter(r => r.user_id !== user.id);
        nextReactions.push({ message_id: commentId, user_id: user.id, reaction_emoji: emoji, id: Math.random() });
      }
      return { ...c, reactions: nextReactions };
    });
    setPostDetails(prev => prev ? ({ ...prev, comments: newComments }) : null);

    // 4. Call real API (using the same toggleReaction)
    toggleReaction(commentId, emoji)
      .catch(err => {
        toast({ variant: 'destructive', title: 'Reaction failed', description: err.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticCommentEdit = (commentId: number, newBody: string) => {
    // 1. Find and update the comment
    const newComments = postDetails.comments.map(c => 
      c.id === commentId ? { ...c, body: newBody, is_edited: true } : c
    );

    // 2. Set optimistic state
    setPostDetails(prev => prev ? ({ ...prev, comments: newComments }) : null);

    // 3. Call real API
    editMessage(commentId, newBody)
      .catch(err => {
        toast({ variant: 'destructive', title: 'Edit failed', description: err.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticCommentDelete = (commentId: number) => {
    // 1. Filter out the comment (unchanged)
    const newComments = postDetails.comments.filter(c => c.id !== commentId);

    // 2. Set optimistic state (THIS IS THE FIX)
    setPostDetails(prev => prev ? ({ 
      ...prev, 
      // ALSO update the post object itself
      post: {
        ...prev.post,
        // Decrement the count
        comment_count: Math.max(0, prev.post.comment_count - 1) 
      },
      comments: newComments 
    }) : null);

    // 3. Call real API (unchanged)
    deleteMessage(commentId)
      .then(() => {
        // ADDED: Refresh the main threads list on success
        refreshSpaces();
      })
      .catch(err => {
        toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticBodyUpdate = (newBody: string) => {
    if (!postDetails) return;

    // 1. Optimistically update state
    setPostDetails(prev => prev ? ({
      ...prev,
      post: { ...prev.post, body: newBody }
    }) : null);

    // 2. Call real API
    editMessage(postDetails.post.first_message_id, newBody)
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticTitleUpdate = (newTitle: string) => {
    if (!postDetails) return;

    // 1. Optimistically update state
    setPostDetails(prev => prev ? ({
      ...prev,
      post: { ...prev.post, title: newTitle }
    }) : null);

    // 2. Call real API
    updatePost(postDetails.post.thread_id, { title: newTitle })
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Failed to save title', description: error.message });
        fetchDetails(); // Revert
      });
  };

  const handleOptimisticPostDelete = () => {
    if (!postDetails) return;
    
    const threadId = postDetails.post.thread_id;
    
    // 1. Show toast and navigate away
    toast({ title: 'Post deleted' });
    navigate('/community'); // Go back to main community page

    // 2. Call real API (fire-and-forget)
    deletePost(threadId)
      .catch((error: any) => {
        // User is already gone, just log the error
        console.error("Failed to delete post:", error);
        // We could show a global toast here if we had a global context
      });
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
                  onReaction={handleOptimisticReaction} 
                  onComment={handleOptimisticComment}
                  onBodyUpdate={handleOptimisticBodyUpdate}
                  onPostDelete={handleOptimisticPostDelete}
                  onTitleUpdate={handleOptimisticTitleUpdate}
                  onCommentReaction={handleOptimisticCommentReaction} // <-- ADDED
                  onCommentEdit={handleOptimisticCommentEdit}       // <-- ADDED
                  onCommentDelete={handleOptimisticCommentDelete}
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
