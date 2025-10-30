import React, { useState, useMemo, useEffect, useRef} from 'react';
import ReactMarkdown from 'react-markdown'; 
import remarkBreaks from 'remark-breaks';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage, AvatarProfile} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  UserPlus,
  Check,
  ThumbsUp,
  MessageSquare,
  Share2,
  File as FileIcon,
  Loader2,
  Smile,
  Edit, 
  Edit2, 
  Trash2,
  Bold,
  Italic
} from 'lucide-react';
import {
  FullPostDetails,
} from '@/integrations/supabase/community.api';
import { ChevronDown, ChevronUp, MoreHorizontal} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { toggleFollow } from '@/integrations/supabase/community.api';
// FIX 1: Add required CSS import for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TRUNCATE_LENGTH = 300;

function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

interface AttachmentPreviewProps {
  attachment: {
    file_url: string;
    file_name: string;
    file_type: string;
  };
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const isImage = attachment.file_type.startsWith('image/');
  const isVideo = attachment.file_type.startsWith('video/');
  const isPdf = attachment.file_type === 'application/pdf';

  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noreferrer"
      className="relative group w-full overflow-hidden flex items-center p-2 border rounded-md"
    >
      {isImage ? (
        <img src={attachment.file_url} alt={attachment.file_name} className="h-16 w-16 rounded-md object-cover flex-shrink-0" />
      ) : isVideo ? (
        <video src={attachment.file_url} muted className="h-16 w-16 rounded-md object-cover flex-shrink-0" />
      ) : isPdf ? (
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
          <Document
            file={attachment.file_url}
            loading={<Loader2 className="h-4 w-4 animate-spin" />}
            error={<FileIcon className="h-8 w-8 text-destructive" />}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          >
            <Page pageNumber={1} width={64} />
          </Document>
        </div>
      ) : (
        <FileIcon className="h-16 w-16 text-muted-foreground flex-shrink-0" />
      )}
      <div className="ml-3 overflow-hidden min-w-0">
        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
      </div>
    </a>
  );
};

// Helper to group reactions
const groupReactions = (reactions: any[]) => {
  if (!reactions) return {};
  return reactions.reduce((acc, reaction) => {
    const emoji = reaction.reaction_emoji;
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, users: [] };
    }
    acc[emoji].count++;
    acc[emoji].users.push(reaction.user_id);
    return acc;
  }, {} as { [key: string]: { count: number; users: string[] } });
};

interface PostDisplayProps {
  post: FullPostDetails['post'];
  commentCount: number;
  refresh: () => void;
  onReaction: (emoji: string) => Promise<void> | void; 
  onBodyUpdate: (newBody: string) => void;
  onPostDelete: () => void; 
  onTitleUpdate: (newTitle: string) => void;
  onCommentClick: () => void;
  canEdit: boolean;
  threadId: string;
}

export const PostDisplay: React.FC<PostDisplayProps> = ({
  post,
  commentCount,
  refresh,
  onReaction,
  onBodyUpdate,
  onPostDelete,
  onTitleUpdate,
  canEdit,
  threadId,
  onCommentClick,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  const [localFollowLoading, setLocalFollowLoading] = useState(false);
  
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedBody, setEditedBody] = useState(post.body || '');
  const [isSavingBody, setIsSavingBody] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title || '');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const authorProfile: AvatarProfile = useMemo(() => ({
    id: post.author_id,
    full_name: post.author_name,
    profile_picture_url: post.author_avatar
  }), [post.author_id, post.author_name, post.author_avatar]);
  const liveIsFollowing = isFollowing(post.author_id);

  // Link preview effect with proper cleanup
  useEffect(() => {
    if (post.attachments && post.attachments.length > 0) {
      setLinkPreview(null);
      return;
    }

    const urls = (post.body || '').match(URL_REGEX);
    if (urls && urls[0]) {
      const firstUrl = urls[0];
      const videoId = getYouTubeVideoId(firstUrl);

      if (videoId) {
        setLinkPreview({ type: 'youtube', data: { embedUrl: `https://www.youtube.com/embed/${videoId}` } });
        return;
      } 
      
      let isCancelled = false;
      setIsPreviewLoading(true);

      supabase.functions.invoke('get-link-preview', { body: { url: firstUrl } })
        .then(({ data, error }) => {
          if (isCancelled) return;
          if (data && !error && (data.title || data.image)) {
            setLinkPreview({ type: 'website', data: data });
          }
        })
        .catch((err) => {
          console.error('Link preview error:', err);
        })
        .finally(() => {
          if (!isCancelled) {
            setIsPreviewLoading(false);
          }
        });
      
      return () => {
        isCancelled = true;
      };
    } else {
      setLinkPreview(null);
    }
  }, [post.body, post.attachments]);
  
  const needsTruncation = useMemo(() => {
    const plainText = (post.body || '').replace(/<[^>]+>/g, '');
    return plainText.length > TRUNCATE_LENGTH;
  }, [post.body]);

  const reactionGroups = useMemo(() => groupReactions(post.reactions), [
    post.reactions,
  ]);

  // FIX 2: Move userHasReacted to useCallback for proper memoization
  const userHasReacted = (emoji: string) => {
    if (!user || !reactionGroups[emoji]) return false;
    return reactionGroups[emoji].users.includes(user.id);
  };

  // FIX 3: Add userHasReacted to dependencies (indirectly via reactionGroups)
  const userHasAnyReaction = useMemo(() => {
    if (!user) return false;
    return REACTIONS.some((emoji) => userHasReacted(emoji));
  }, [user, reactionGroups]);

  const handleShare = () => {
    const postUrl = window.location.href;
    
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({
          title: 'Link Copied!',
          description: 'The link to this post has been copied to your clipboard.',
        });
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not copy the link.',
        });
      });
  };

  const handleReaction = async (emoji: string) => {
    if (isReactionLoading || !user) return;
    setIsReactionLoading(true);
    try {
      await onReaction(emoji); 
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsReactionLoading(false);
      setTimeout(() => setPopoverOpen(false), 300);
    }
  };

  const applyFormat = (format: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedBody.substring(start, end);

    if (selectedText.length === 0) {
      textarea.focus();
      return;
    }

    const symbols = format === 'bold' ? '**' : '*';
    const symbolLength = symbols.length;

    const textBefore = editedBody.substring(start - symbolLength, start);
    const textAfter = editedBody.substring(end, end + symbolLength);

    let newValue: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;

    // Check if text is already formatted (toggle off)
    if (textBefore === symbols && textAfter === symbols) {
      newValue =
        editedBody.substring(0, start - symbolLength) +
        selectedText +
        editedBody.substring(end + symbolLength);

      newSelectionStart = start - symbolLength;
      newSelectionEnd = end - symbolLength;
    } else {
      // Apply formatting (toggle on)
      newValue =
        editedBody.substring(0, start) +
        symbols +
        selectedText +
        symbols +
        editedBody.substring(end);

      newSelectionStart = start + symbolLength;
      newSelectionEnd = end + symbolLength;
    }

    // Sync state and manually update textarea for immediate selection
    textarea.value = newValue;
    setEditedBody(newValue);
    textarea.focus();
    textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
  };

  const handleSaveBody = () => {
    if (!editedBody.trim() || editedBody === post.body) {
      setIsEditingBody(false);
      return;
    }
    
    setIsSavingBody(true);
    onBodyUpdate(editedBody); 
    
    setTimeout(() => {
      setIsEditingBody(false);
      setIsSavingBody(false);
    }, 500);
  };

  const startEdit = () => {
    setEditedBody(post.body || '');
    setIsEditingBody(true);
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim() || editedTitle === post.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    onTitleUpdate(editedTitle);
    
    setTimeout(() => {
      setIsEditingTitle(false);
      setIsSavingTitle(false);
    }, 500);
  };

  const startEditTitle = () => {
    setEditedTitle(post.title || '');
    setIsEditingTitle(true);
  };

  const handleFollow = async () => {
    if (!user) return; // Auth check
    
    setLocalFollowLoading(true);
    try {
      await toggleFollow(post.author_id);
      await refetchSocialGraph();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLocalFollowLoading(false);
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4 sm:p-6">
        {/* Author Info & Follow Button */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <Link
              to={`/profile/${post.author_id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar profile={authorProfile} className="h-10 w-10">
                <AvatarImage alt={post.author_name || 'Author'} />
                <AvatarFallback />
              </Avatar>
              <div>
                <p className="font-semibold group-hover:underline">
                  {post.author_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {post.author_position}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </Link>
            {user && user.id !== post.author_id && (
              <Button
                variant={liveIsFollowing ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleFollow}
                disabled={localFollowLoading}
                className="w-full sm:w-auto"
              >
                {localFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : liveIsFollowing ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {liveIsFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={startEditTitle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Post Body
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={onPostDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title Edit/Display */}
        {isEditingTitle ? (
          <div className="space-y-2 mb-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(false)} disabled={isSavingTitle}>Cancel</Button>
              <Button size="sm" onClick={handleSaveTitle} disabled={isSavingTitle}>
                {isSavingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        )}

        {/* Post Body */}
        {isEditingBody ? (
          <div className="space-y-2">
            <div className="border rounded-md rounded-b-none p-1 flex items-center space-x-1 bg-muted/50">
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => applyFormat('bold')}
                aria-label="Bold"
                title="Bold (Ctrl+B)"
                disabled={isSavingBody}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => applyFormat('italic')}
                aria-label="Italic"
                title="Italic (Ctrl+I)"
                disabled={isSavingBody}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              ref={textareaRef} // <-- Add the ref
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              autoFocus
              className="rounded-t-none mt-0 focus-visible:ring-offset-0" // <-- Style adjustments
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingBody(false)}
                disabled={isSavingBody}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveBody}
                disabled={isSavingBody}
              >
                {isSavingBody ? (
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`
                prose prose-sm dark:prose-invert max-w-none
                ${needsTruncation && !isExpanded ? 'line-clamp-4' : ''}
              `}
            >
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {post.body || ''}
              </ReactMarkdown>
            </div>

            {needsTruncation && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-primary hover:no-underline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}  
              </Button>
            )}
          </>
        )}

        {/* Attachments and Link Previews */}
        <div className="mt-4 space-y-4">
          {post.attachments && post.attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.attachments.map((att: any) => {
                const isImage = att.file_type.startsWith('image/');
                const isVideo = att.file_type.startsWith('video/');

                if (isImage) {
                  return (
                    <a
                      key={att.file_url}
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-full h-auto object-cover max-h-[600px]"
                      />
                    </a>
                  );
                }

                if (isVideo) {
                  return (
                    <div key={att.file_url} className="rounded-lg overflow-hidden border bg-black">
                      <video
                        src={att.file_url}
                        controls
                        className="w-full h-auto max-h-[600px]"
                      />
                    </div>
                  );
                }

                // Fallback for PDF, ZIP, etc. using your original component
                return <AttachmentPreview key={att.file_url} attachment={att} />;
              })}
            </div>
          )}

          {isPreviewLoading && (
            <div className="flex items-center text-sm text-muted-foreground p-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Fetching preview...</span>
            </div>
          )}
          
          {linkPreview && (!post.attachments || post.attachments.length === 0) && (
            <div className="relative mt-2 border rounded-lg overflow-hidden">
              <div className="p-2 text-sm text-muted-foreground bg-accent rounded-t-lg">
                <a 
                  href={post.body?.match(URL_REGEX)?.[0]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-primary break-all"
                >
                  {post.body?.match(URL_REGEX)?.[0]}
                </a>
              </div>
              {linkPreview.type === 'youtube' && (
                <div className="aspect-video w-full">
                  <iframe
                    width="100%" 
                    height="100%"
                    src={linkPreview.data.embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              {linkPreview.type === 'website' && (
                <>
                  {linkPreview.data.image && <img src={linkPreview.data.image} alt="Preview" className="w-full h-48 object-cover" />}
                  <div className="p-4">
                    <h4 className="font-semibold truncate">{linkPreview.data.title || 'No Title Found'}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{linkPreview.data.description || 'No Description'}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Reaction Counts */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            {Object.entries(reactionGroups).map(([emoji, { count }]) => (
              <Badge
                key={emoji}
                variant={userHasReacted(emoji) ? 'default' : 'secondary'}
                className="px-2 py-1 cursor-pointer"
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {count}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={userHasAnyReaction ? 'secondary' : 'ghost'}
                className="w-full"
                disabled={isReactionLoading || !user}
              >
                {isReactionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Smile className="h-5 w-5" />
                )}
                <span className="ml-2 hidden sm:inline">React</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
              <div className="flex gap-1">
                {REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={userHasReacted(emoji) ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 text-lg rounded-full"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" className="w-full" onClick={onCommentClick}>
            <MessageSquare className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">
              Comment ({commentCount})
            </span>
          </Button>

          <Button variant="ghost" className="w-full" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
