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
import { Reply, Trash2, Pencil, Paperclip, SmilePlus } from 'lucide-react';

// --- PLACEHOLDER COMPONENTS (Use shadcn Popover/Dropdown in production) ---
const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
    <div className="flex gap-1 p-1 bg-white border rounded-full shadow-lg">
        {['👍', '❤️', '🔥', '🤔', '😂'].map(emoji => (
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
    
    const handleReply = () => {
        onReplyClick(message);
    }

    const messageContent = isEditing ? (
        <div className="flex flex-col gap-2 w-full">
            <Textarea 
                value={editedBody} 
                onChange={(e) => setEditedBody(e.target.value)} 
                autoFocus
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

    const ActionMenu = () => (
        <div className={cn(
            "absolute top-0 flex items-center bg-card border rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100",
            isCurrentUser ? "right-full mr-2" : "left-full ml-2"
        )}>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReply} title="Reply"><Reply className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(!showPicker)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
            {isCurrentUser && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit"><Pencil className="h-4 w-4" /></Button>
            )}
            {(isCurrentUser || canModerate) && (
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={handleDelete} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            )}
        </div>
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
                    {!isCurrentUser && !isReply && ( <span className="font-bold text-sm">{displayName}</span> )}
                    <span className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble & Reactions */}
                <div className="relative flex items-center">
                    {/* For others' messages, actions appear on the right */}
                    {!isCurrentUser && <div className="order-2"><ActionMenu /></div>}

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

                    {isCurrentUser && <div className="order-first"><ActionMenu /></div>}

                    {/* Emoji picker appears above the action menu */}
                    {showPicker && (
                        <div className="absolute top-0 z-10 -translate-y-full mb-1">
                           <EmojiPicker onSelect={handleReaction} />
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
