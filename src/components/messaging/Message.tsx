import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, Image as ImageIcon, File as FileIcon, AlertCircle } from 'lucide-react';
import { 
    MessageWithDetails, 
    MessageAttachment,
    editMessage,
    addReaction,
    removeReaction,
} from '@/integrations/supabase/community.api'; 
import { Reply, Trash2, Pencil, Paperclip, SmilePlus } from 'lucide-react';

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
    <div className="flex gap-1 p-1 bg-background border rounded-full shadow-lg">
        {['👍', '❤️', '🔥', '🤔', '😂'].map(emoji => (
            <span key={emoji} className="cursor-pointer hover:bg-muted rounded-full p-1 transition-colors" onClick={() => onSelect(emoji)}>{emoji}</span>
        ))}
    </div>
);

// Simplified props to match what ThreadView provides
interface MessageProps {
    message: MessageWithDetails;
    currentUserId: string;
    canModerate: boolean; 
    onDelete: (messageId: number) => void;
    onEditMessage: (messageId: number, newBody: string) => void; 
    onReplyClick: (message: MessageWithDetails) => void;
    onReaction: (messageId: number, emoji: string) => void;
}

const Attachment: React.FC<{ attachment: MessageAttachment & { isUploading?: boolean } }> = ({ attachment }) => {
    console.log("2. Attachment component received:", attachment);
    const isImage = attachment.file_type?.startsWith('image/');
    console.log("3. Is it an image?", isImage);
    
    if (attachment.isUploading) {
        return (
            <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium truncate">{attachment.file_name}</span>
            </div>
        );
    }
    
    if (attachment.file_url === 'upload-failed') {
        return (
             <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-destructive/20 border-destructive text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium truncate">Upload Failed: {attachment.file_name}</span>
            </div>
        )
    }

    if (isImage) {
        return (
            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img 
                    src={attachment.file_url} 
                    alt={attachment.file_name} 
                    className="max-w-xs max-h-64 rounded-lg object-cover border"
                />
            </a>
        );
    }

    return (
        <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted border hover:bg-muted/80 transition-colors">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{attachment.file_name}</span>
                {attachment.file_size_bytes && <span className="text-xs text-muted-foreground">{(attachment.file_size_bytes / 1024).toFixed(1)} KB</span>}
            </div>
        </a>
    );
};

export const Message: React.FC<MessageProps> = ({ 
    message, 
    currentUserId, 
    canModerate,
    onDelete,
    onEditMessage, 
    onReplyClick,
    onReaction 
}) => {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState(message.body);
    const [showPicker, setShowPicker] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const isCurrentUser = message.user_id === currentUserId;
    const displayName = message.author?.full_name || 'User';
    const avatarUrl = message.author?.profile_picture_url;
    
    const reactionCounts = useMemo(() => {
        return message.reactions.reduce((acc, reaction) => {
            acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.reactions]);

    const handleReaction = (emoji: string) => {
        onReaction(message.id, emoji);
        setShowPicker(false);
    };
    
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            onDelete(message.id);
        }
    };
    
    const handleEditSave = async () => {
        if (!editedBody.trim() || editedBody === message.body) {
            setIsEditing(false);
            return;
        }
        // Call the parent's handler function instead of the API
        onEditMessage(message.id, editedBody); 
        setIsEditing(false);
    };

    const messageContent = isEditing ? (
        <div className="flex flex-col gap-2 w-full">
            {/* FIX: Corrected e.g.value to e.target.value */}
            <Textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)} autoFocus rows={4} />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleEditSave}>Save</Button>
            </div>
        </div>
    ) : (
        // FIX: Correctly closed the React Fragment
        <>
            {message.parent_message && (
                <div className="text-xs rounded-md p-2 border-l-2 border-current/50 bg-current/10 mb-2">
                    <p className="font-bold">{message.parent_message.author?.full_name}</p>
                    <p className="truncate opacity-80">{message.parent_message.body}</p>
                </div>
            )}
            <p className="text-sm break-words whitespace-pre-wrap">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
            {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2">
                    {message.attachments.map(att => (
                        <Attachment key={att.id} attachment={att as MessageAttachment & { isUploading?: boolean }} />
                    ))}
                </div>
          )}
        </>
    );
    
    const messageStyle = cn(
        "flex flex-col rounded-xl px-4 py-3 max-w-[85%] sm:max-w-lg shadow-sm cursor-pointer group relative",
        isCurrentUser 
            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100" 
            : "bg-card border"
    );

    return (
        <div className={cn("flex w-full gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
            {!isCurrentUser && (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
            )}
            
            <div className={cn("flex flex-col w-full relative", isCurrentUser ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className={messageStyle} onClick={() => setShowActions(p => !p)}>
                    {messageContent}
                </div>

                {showActions && (
                    <div className={cn(
                        "absolute z-10 flex items-center bg-card border rounded-full shadow-md",
                        // Consistent positioning for all screen sizes:
                        "top-[-16px]", // Position it slightly above the message bubble
                        isCurrentUser
                          ? "right-2" // Place it on the right for the current user
                          : "left-2"  // Place it on the left for other users
                    )}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onReplyClick(message); setShowActions(false); }} title="Reply"><Reply className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setShowPicker(p => !p); setShowActions(false); }} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
                        {isCurrentUser && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowActions(false); }} title="Edit"><Pencil className="h-4 w-4" /></Button>}
                        {(isCurrentUser || canModerate) && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(); setShowActions(false); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                )}
                {/* Emoji Picker */}
                {showPicker && <div className="absolute top-0 z-20"><EmojiPicker onSelect={handleReaction} /></div>}

                {Object.keys(reactionCounts).length > 0 && (
                    <div className="mt-1 flex gap-1">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <div 
                                key={emoji} 
                                className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border",
                                    message.reactions.some(r => r.reaction_emoji === emoji && r.user_id === currentUserId) 
                                        ? "bg-primary/20 border-primary" 
                                        : "bg-muted border-muted-foreground/20 hover:bg-muted/80"
                                )}
                                onClick={() => handleReaction(emoji)}
                            >
                                <span>{emoji}</span> 
                                <span className="font-medium text-foreground/80">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {isCurrentUser && (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
// FIX: Added the missing closing brace for the component
};
