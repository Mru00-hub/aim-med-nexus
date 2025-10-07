import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
    MessageWithDetails, 
    MessageReaction, 
    addReaction, 
    removeReaction,
    deleteMessage, 
    editMessage
} from '@/integrations/supabase/community.api'; 
import { UserProfileCard } from '@/components/ui/UserProfileCard';
import { Reply, Trash2, Pencil, Paperclip } from 'lucide-react';

// --- PLACEHOLDER API FUNCTIONS (Assume these are in community.api.ts) ---
const deleteMessage = async (messageId: number) => {
    // NOTE: RLS must enforce that only the creator or an Admin/Mod can delete.
    // await supabase.from('messages').delete().eq('id', messageId);
    return { success: true }; 
};
const editMessage = async (messageId: number, newBody: string) => {
    // NOTE: RLS must enforce that only the creator can edit.
    // await supabase.from('messages').update({ body: newBody, is_edited: true, updated_at: new Date().toISOString() }).eq('id', messageId);
    return { success: true }; 
};

// --- PLACEHOLDER COMPONENTS (Use shadcn Popover/Dropdown in production) ---
const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
    <div className="flex gap-1 p-1 bg-white border rounded-full shadow-lg">
        {['👍', '❤️', '🔥', '🤔'].map(emoji => (
            <span key={emoji} className="cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors" onClick={() => onSelect(emoji)}>{emoji}</span>
        ))}
    </div>
);
// --- END PLACEHOLDERS ---


interface MessageProps {
    message: MessageWithDetails;
    currentUserId: string; // Passed down from ThreadView for faster comparison
    isReply?: boolean; // For styling nested replies
    refetchMessages: () => Promise<void>; // To refresh the parent view after CRUD operations
    onReplyClick: (message: MessageWithDetails) => void;
    onDelete: (messageId: number) => void;// To set the input field to reply mode
}

export const Message: React.FC<MessageProps> = ({ 
    message, 
    currentUserId, 
    isReply = false, 
    refetchMessages, 
    onReplyClick,
    onDelete
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState(message.body);
    const [showPicker, setShowPicker] = useState(false);

    const isCurrentUser = message.user_id === currentUserId;
    const displayName = message.author?.full_name || 'User';
    const avatarUrl = message.author?.profile_picture_url;
    // NOTE: This should come from CommunityContext, assuming user has 'ADMIN' or 'MODERATOR' role in the parent space.
    const canModerate = false; 

    const handleDelete = () => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        // Just call the parent's delete handler. The parent will handle the UI and API call.
        onDelete(message.id);
    };

    const handleEditSave = async () => {
        if (editedBody.trim() && editedBody !== message.body) {
            try {
                await editMessage(message.id, editedBody);
                toast({ title: 'Updated', description: 'Message edited successfully.' });
                await refetchMessages(); // Refetch after edit
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            } finally {
                setIsEditing(false);
            }
        } else {
            setIsEditing(false); // Cancel if no changes were made
        }
    };
    
    // Group and count reactions
    const reactionCounts = useMemo(() => {
        return message.reactions.reduce((acc, reaction) => {
            acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.reactions]);

    // --- Action Handlers ---

    const handleReaction = async (emoji: string) => {
        try {
            if (!user) throw new Error("Login required to react.");
            
            // Check if user has already reacted with this specific emoji
            const existingReaction = message.reactions.find(
                r => r.user_id === currentUserId && r.reaction_emoji === emoji
            );

            if (existingReaction) {
                await removeReaction(message.id, emoji);
            } else {
                await addReaction(message.id, emoji);
            }
            refetchMessages(); 
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reaction Failed', description: error.message });
        } finally {
            setShowPicker(false);
        }
    };
    
    const handleDelete = async () => {
        // Use custom modal/dialog instead of browser confirm() in your final application!
        if (!window.confirm("Are you sure you want to delete this message?")) return; 
        try {
            await deleteMessage(message.id);
            toast({ title: 'Deleted', description: 'Message removed successfully.' });
            refetchMessages(); 
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        }
    };

    const handleEditSave = async () => {
        if (editedBody === message.body || !editedBody.trim()) {
            setIsEditing(false);
            return;
        }
        try {
            await editMessage(message.id, editedBody);
            toast({ title: 'Updated', description: 'Message edited successfully.' });
            setIsEditing(false);
            refetchMessages(); 
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
        }
    };
    
    const handleReply = () => {
        onReplyClick(message);
    }

    const messageContent = isEditing ? (
        <div className="flex flex-col gap-2 w-full">
            <Textarea 
                value={editedBody} 
                onChange={(e) => setEditedBody(e.target.value)} 
                rows={isReply ? 2 : 4}
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleEditSave} disabled={!editedBody.trim()}>Save</Button>
            </div>
        </div>
    ) : (
        <p className="text-sm break-words whitespace-pre-wrap">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
    );
    
    const messageStyle = cn(
        "flex flex-col rounded-xl px-4 py-3 max-w-[85%] sm:max-w-lg shadow-sm transition-all duration-200",
        isCurrentUser ? "bg-primary text-primary-foreground self-end" : "bg-card border self-start",
        isReply && "text-sm" // Smaller text for replies
    );


    return (
        <div className={cn("flex w-full gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
            {/* Avatar (Only visible for others' messages) */}
            {!isCurrentUser && (
                <Avatar className={cn(isReply && "h-7 w-7 mt-3")}>
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
            )}

            <div className="flex flex-col">
                {/* Author & Timestamp (Above the message bubble) */}
                <div className={cn(
                    "flex items-center gap-2 mb-1", 
                    isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}>
                    {/* Display name only for others or if it's a main message */}
                    {!isCurrentUser && !isReply && (
                        <UserProfileCard userId={message.user_id}>
                          <span className="font-bold text-sm cursor-pointer hover:underline text-foreground">
                            {displayName}
                          </span>
                        </UserProfileCard>
                    )}
                    <span className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Message Bubble & Reactions */}
                <div className="flex gap-1 items-start">
                    {/* Action Menu (Reply and Reaction for others' messages) */}
                    {!isCurrentUser && !isEditing && (
                        <div className="relative mt-2 flex flex-col gap-1">
                             <Button 
                                variant="ghost" 
                                size="xs" 
                                className="p-1 h-6 hover:bg-muted/50" 
                                onClick={handleReply}
                                title="Reply to Message"
                            >
                                <Reply className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="xs" 
                                className="p-1 h-6 hover:bg-muted/50" 
                                onClick={() => setShowPicker(!showPicker)}
                                title="Add Reaction"
                            >
                                {/* Using the pencil icon as a toggle for the picker */}
                                <Pencil className="h-4 w-4 transform rotate-90" /> 
                            </Button>
                           
                            {showPicker && (
                                <div className="absolute top-0 right-0 z-10 -translate-y-full mb-1">
                                    <EmojiPicker onSelect={handleReaction} />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={messageStyle}>
                        {messageContent}
                        
                        {/* Attachments Section */}
                        {message.attachments?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                                {message.attachments.map(att => (
                                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline hover:no-underline">
                                        <Paperclip className="h-3 w-3" />
                                        {att.file_name}
                                    </a>
                                ))}
                            </div>
                        )}
                        
                        {/* Reactions Bar */}
                        {Object.keys(reactionCounts).length > 0 && (
                            <div className="mt-2 flex gap-2 pt-1 border-t border-current/20">
                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                    <span 
                                        key={emoji} 
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer",
                                            (message.reactions.filter(r => r.reaction_emoji === emoji && r.user_id === currentUserId).length > 0)
                                                ? (isCurrentUser ? "bg-black/20" : "bg-primary/20 border-primary") // Highlight if current user reacted
                                                : (isCurrentUser ? "bg-black/10" : "bg-muted-foreground/10")
                                        )}
                                        onClick={() => handleReaction(emoji)}
                                    >
                                        {emoji} 
                                        <span className="font-medium">{count}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Menu (Edit/Delete for current user or Moderator/Admin) */}
                    {!isEditing && (isCurrentUser || canModerate) && (
                        <div className="relative mt-2 flex flex-col gap-1">
                            {isCurrentUser && (
                                <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    className="p-1 h-6 hover:bg-muted/50" 
                                    onClick={() => setIsEditing(true)}
                                    title="Edit Message"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {(isCurrentUser || canModerate) && (
                                <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    className="p-1 h-6 hover:bg-red-100" 
                                    onClick={handleDelete}
                                    title="Delete Message"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                             {!isCurrentUser && (
                                <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    className="p-1 h-6 hover:bg-muted/50" 
                                    onClick={handleReply}
                                    title="Reply to Message"
                                >
                                    <Reply className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}

                </div>
            </div>
            
            {/* Avatar (Only visible for current user) */}
            {isCurrentUser && (
                <Avatar className={cn(isReply && "h-7 w-7 mt-3")}>
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
};
