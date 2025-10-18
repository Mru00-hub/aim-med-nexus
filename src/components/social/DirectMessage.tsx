// src/components/social/DirectMessage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SmilePlus, Trash2, Pencil, Reply, Loader2, AlertCircle, Download, File as FileIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmojiPicker } from './EmojiPicker';
import { DirectMessageAttachment, DirectMessageWithDetails } from '@/integrations/supabase/social.api';
import { MessageWithParent } from '@/hooks/useConversationData'; // NEW: Import the rich type
import { decryptFile, decryptMessage } from '@/lib/crypto';

const Attachment: React.FC<{ 
  attachment: DirectMessageAttachment & { isUploading?: boolean };
  conversationKey: CryptoKey; // 👈 We now need the key
}> = ({ attachment, conversationKey }) => {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedName, setDecryptedName] = useState('Loading file...');
  const [decryptedImgUrl, setDecryptedImgUrl] = useState<string | null>(null);

  // 1. Decrypt the file name as soon as the component loads
  useEffect(() => {
    const getFileName = async () => {
      if (!conversationKey || attachment.isUploading || attachment.file_url === 'upload-failed') return;
      try {
        const name = await decryptMessage(attachment.file_name, conversationKey);
        setDecryptedName(name);
      } catch (e) {
        setDecryptedName('Secured File');
      }
    };
    getFileName();
  }, [attachment.file_name, conversationKey, attachment.isUploading, attachment.file_url]);

  // 2. If it's an image, decrypt the blob to show a preview
  useEffect(() => {
    const decryptImage = async () => {
      if (!conversationKey || !attachment.file_type?.startsWith('image/') || attachment.isUploading) {
        return;
      }

      setIsDecrypting(true);
      try {
        const response = await fetch(attachment.file_url);
        const encryptedBlob = await response.blob();
        const decryptedBlob = await decryptFile(encryptedBlob, attachment.iv, conversationKey);
        const url = URL.createObjectURL(decryptedBlob);
        setDecryptedImgUrl(url);
      } catch (e) {
        console.error("Failed to decrypt image:", e);
      } finally {
        setIsDecrypting(false);
      }
    };
    decryptImage();
    
    // Cleanup function to revoke the object URL
    return () => {
      if (decryptedImgUrl) {
        URL.revokeObjectURL(decryptedImgUrl);
      }
    };
  }, [attachment.file_url, attachment.iv, conversationKey, attachment.file_type, attachment.isUploading]);
  
  // 3. Handle downloads for non-image files
  const handleDownload = async () => {
    if (!conversationKey) return; 
    setIsDecrypting(true);
    try {
      // 1. Fetch the encrypted blob
      const response = await fetch(attachment.file_url);
      const encryptedBlob = await response.blob();

      // 2. Decrypt it
      const decryptedBlob = await decryptFile(encryptedBlob, attachment.iv, conversationKey);
      
      // 3. Create a temporary link to trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = decryptedName; // Use the decrypted file name
      document.body.appendChild(a);
      a.click();
      
      // 4. Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to decrypt file:", e);
    } finally {
      setIsDecrypting(false);
    }
  };

  // --- RENDER LOGIC ---
  if (attachment.isUploading) {
    return <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border animate-pulse"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs truncate">{attachment.file_name}</span></div>;
  }
  if (attachment.file_url === 'upload-failed') {
    return <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-destructive/20 text-destructive"><AlertCircle className="h-4 w-4" /><span className="text-xs truncate">Upload Failed</span></div>;
  }
  
  // Render for IMAGE files
  if (attachment.file_type?.startsWith('image/')) {
    if (isDecrypting && !decryptedImgUrl) {
      return <div className="flex items-center justify-center p-2 mt-2 w-full h-40 rounded-lg bg-muted border animate-pulse"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }
    return (
      <a href={decryptedImgUrl || undefined} target="_blank" rel="noopener noreferrer" className="mt-2 block">
        <img src={decryptedImgUrl || undefined} alt={decryptedName} className="max-w-xs max-h-64 rounded-lg object-cover border"/>
      </a>
    );
  }
  return (
    <Button 
      variant="outline" 
      onClick={handleDownload} 
      disabled={isDecrypting}
      className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border hover:bg-muted/80 w-full justify-start"
    >
      {isDecrypting 
        ? <Loader2 className="h-4 w-4 animate-spin" /> 
        : <Download className="h-4 w-4" />
      }
      <p className="text-sm font-medium truncate">{decryptedName}</p>
    </Button>
  );
};

interface DirectMessageProps {
  message: MessageWithParent;
  currentUserId: string;
  conversationKey: CryptoKey;
  onReplyClick: (message: DirectMessageWithDetails) => void;
  onDelete: (messageId: number) => void;
  onEdit: (messageId: number, newContent: string) => void;
  onReaction: (messageId: number, emoji: string) => void;
}

export const DirectMessage = ({ message, currentUserId, conversationKey, onReplyClick, onDelete, onEdit, onReaction }: DirectMessageProps) => {
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
                      <Attachment key={att.id} attachment={att as any} conversationKey={conversationKey} />
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
