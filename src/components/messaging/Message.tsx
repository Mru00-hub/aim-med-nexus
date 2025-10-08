import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
    MessageWithDetails, 
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
    onDelete: (messageId: number) => void;
    onReplyClick: (message: MessageWithDetails) => void;
    onReaction: (messageId: number, emoji: string) => void;
}

export const Message: React.FC<MessageProps> = ({ 
    message, 
    currentUserId, 
    onDelete,
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
    const canModerate = false; // Placeholder for moderation logic
    
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
        try {
            await editMessage(message.id, editedBody);
            toast({ title: 'Message Updated' });
            // The UI will update via the real-time subscription in the parent
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
        } finally {
            setIsEditing(false);
        }
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
            
            <div className={cn("flex flex-col w-full max-w-lg", isCurrentUser ? "items-end" : "items-start")}>
                {/* Author & Timestamp */}
                <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser && <span className="font-bold text-sm">{displayName}</span>}
                    <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Main Message Bubble */}
                <div 
                    className={messageStyle}
                    // --- CHANGE: Added onClick to toggle the action menu ---
                    onClick={() => setShowActions(prev => !prev)}
                >
                    {/* The actual message content (text or edit form) */}
                    {messageContent}
                </div>

                {showActions && (
                    <div className={cn(
                        "absolute top-[-16px] z-10 flex items-center bg-card border rounded-full shadow-md",
                        isCurrentUser ? "right-0" : "left-0"
                    )}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { onReplyClick(message); setShowActions(false); }} title="Reply"><Reply className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(p => !p)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
                        {isCurrentUser && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsEditing(true); setShowActions(false); }} title="Edit"><Pencil className="h-4 w-4" /></Button>}
                        {(isCurrentUser || canModerate) && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                )}

                {/* Emoji Picker */}
                {showPicker && <div className="absolute top-0 z-10 -translate-y-full mb-1"><EmojiPicker onSelect={handleReaction} /></div>}

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
