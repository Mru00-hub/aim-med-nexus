// src/components/social/DirectMessage.tsx

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SmilePlus, Trash2, Pencil, Reply, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmojiPicker } from './EmojiPicker';
import { DirectMessageAttachment, DirectMessageWithDetails } from '@/integrations/supabase/social.api';
import { MessageWithParent } from '@/hooks/useConversationData'; // NEW: Import the rich type

// NEW: Attachment sub-component, learned from your working example
const Attachment: React.FC<{ attachment: DirectMessageAttachment & { isUploading?: boolean } }> = ({ attachment }) => {
    if (attachment.isUploading) {
        return <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border animate-pulse"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs truncate">{attachment.file_name}</span></div>;
    }
    if (attachment.file_url === 'upload-failed') {
        return <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-destructive/20 text-destructive"><AlertCircle className="h-4 w-4" /><span className="text-xs truncate">Upload Failed</span></div>;
    }
    if (attachment.file_type?.startsWith('image/')) {
        return <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 block"><img src={attachment.file_url} alt={attachment.file_name} className="max-w-xs max-h-64 rounded-lg object-cover border"/></a>;
    }
    return <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border hover:bg-muted/80"><p className="text-sm font-medium truncate">{attachment.file_name}</p></a>;
};


interface DirectMessageProps {
  message: MessageWithParent;
  currentUserId: string;
  onReplyClick: (message: DirectMessageWithDetails) => void;
  onDelete: (messageId: number) => void;
  onEdit: (messageId: number, newContent: string) => void;
  onReaction: (messageId: number, emoji: string) => void;
}

export const DirectMessage = ({ message, currentUserId, onReplyClick, onDelete, onEdit, onReaction }: DirectMessageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [showActions, setShowActions] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const isMe = message.sender_id === currentUserId;
    const displayName = message.author?.full_name || 'User';
    
    const reactionCounts = useMemo(() => {
        return (message.reactions || []).reduce((acc, reaction) => {
            acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.reactions]);

    const handleSaveEdit = () => {
        if (!editedContent.trim() || editedContent.trim() === message.content) {
            setIsEditing(false);
            return;
        }
        onEdit(message.id, editedContent.trim());
        setIsEditing(false);
    };

    const handleReactionClick = (emoji: string) => {
        onReaction(message.id, emoji);
        setShowPicker(false);
        setShowActions(false);
    }
    
    // FIX: Squeezed text (Problem #1) is solved by adding max-w classes and word break utilities.
    const messageStyle = cn(
        "flex flex-col rounded-xl px-4 py-3 shadow-sm relative group cursor-pointer",
        "max-w-[85%] sm:max-w-lg", // This limits the width
        isMe 
            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100" // Lighter blue style
            : "bg-card border"
    );

    const messageContent = isEditing ? (
        <div className="w-64">
          <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} autoFocus rows={3} className="bg-background text-foreground" />
          <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
          </div>
        </div>
    ) : (
        <>
          {/* FIX: Reply preview (Problem #2) now works because useConversationData provides the parent_message_details object. */}
          {message.parent_message_details && (
              <div className="text-xs rounded-md p-2 border-l-2 border-current/50 bg-current/10 mb-2 opacity-80">
                  <p className="font-bold">{message.parent_message_details.author?.full_name}</p>
                  <p className="truncate">{message.parent_message_details.content}</p>
              </div>
          )}
          {/* FIX: Word break utilities also help solve Problem #1 */}
          <p className="text-sm break-words whitespace-pre-wrap">{message.content} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
          {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                  {message.attachments.map(att => (
                      <Attachment key={att.id} attachment={att as any} />
                  ))}
              </div>
          )}
        </>
    );

    return (
        <div className={cn("flex w-full items-start gap-3 relative", isMe ? "justify-end" : "justify-start")}>
            {!isMe && <Avatar className="h-8 w-8 flex-shrink-0">...</Avatar>}
            
            {/* This is the main content wrapper */}
            <div className={cn("flex flex-col w-auto", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* The main message bubble itself */}
                <div onClick={() => setShowActions(p => !p)}>
                    <div className={messageStyle}>
                        {messageContent}
                    </div>
                </div>

                {Object.keys(reactionCounts).length > 0 && (
                    <div className={cn("mt-1 flex gap-1", isMe ? "justify-end" : "justify-start")}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <Badge key={emoji} variant="secondary" className="shadow-sm cursor-pointer" onClick={() => handleReactionClick(emoji)}>
                                {emoji} {count}
                            </Badge>
                        ))}
                    </div>
                )}
            
                {/* FIX: The menu is now stable because it's only controlled by the `showActions` state */}
                {showActions && (
                    <div className={cn("absolute z-10 flex items-center bg-card border rounded-full shadow-md", "top-[-16px]", isMe ? "right-12" : "left-12")}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { onReplyClick(message); setShowActions(false); }} title="Reply"><Reply className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(p => !p)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
                        {isMe && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsEditing(true); setShowActions(false); }} title="Edit"><Pencil className="h-4 w-4" /></Button>}
                        {isMe && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(message.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                )}
                {showPicker && (
                     <div className="absolute z-20 top-[-20px] left-1/2 -translate-x-1/2">
                        <EmojiPicker onSelect={handleReactionClick} />
                    </div>
                )}
            </div>

            {isMe && <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={message.author?.profile_picture_url || undefined} /><AvatarFallback>{displayName.charAt(0)}</AvatarFallback></Avatar>}
        </div>
    );
};
