import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { MessageWithDetails, editMessage } from '@/integrations/supabase/community.api'; 
import { Reply, Trash2, Pencil, Paperclip, SmilePlus } from 'lucide-react';

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
    <div className="flex gap-1 p-1 bg-white border rounded-full shadow-lg">
        {['👍', '❤️', '🔥', '🤔', '😂'].map(emoji => (
            <span key={emoji} className="cursor-pointer hover:bg-gray-100 rounded-full p-1" onClick={() => onSelect(emoji)}>{emoji}</span>
        ))}
    </div>
);

interface MessageProps {
    message: MessageWithDetails;
    currentUserId: string;
    onReplyClick: (message: MessageWithDetails) => void;
    onDelete: (messageId: number) => void;
    onEdit: (messageId: number, newBody: string) => void;
    onReaction: (messageId: number, emoji: string) => void;
    replyTo?: { author: string; body: string; } | null;
}

export const Message: React.FC<MessageProps> = ({ 
    message, 
    currentUserId, 
    onReplyClick,
    onDelete,
    onEdit,
    onReaction,
    replyTo
}) => {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState(message.body);
    const [showPicker, setShowPicker] = useState(false);

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
        try {
            await editMessage(message.id, editedBody);
            // The optimistic update will come from the parent via real-time subscription
            toast({ title: 'Message Updated' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
        } finally {
            setIsEditing(false);
        }
    };

    const messageContent = isEditing ? (
        <div className="flex flex-col gap-2 w-full">
            <Textarea value={editedBody} onChange={(e) => setEditedBody(e.g.value)} autoFocus rows={4} />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleEditSave}>Save</Button>
            </div>
        </div>
    ) : (
        <>
        {message.parent_message && (
            <div className="text-xs rounded-md p-2 border-l-2 border-current/50 bg-current/10 mb-2">
                <p className="font-bold">{message.parent_message.author?.full_name}</p>
                <p className="truncate opacity-80">{message.parent_message.body}</p>
            </div>
        )}
        <p className="text-sm break-words whitespace-pre-wrap">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
    );
    
    const messageStyle = cn("flex flex-col rounded-xl px-4 py-3 max-w-[85%] sm:max-w-lg shadow-sm", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-card border");

    const ActionMenu = () => (
        <div className={cn("absolute top-0 -mt-4 flex items-center bg-card border rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100", isCurrentUser ? "right-0" : "left-0")}>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReplyClick(message)} title="Reply"><Reply className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(!showPicker)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
            {isCurrentUser && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit"><Pencil className="h-4 w-4" /></Button>}
            {isCurrentUser && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => onDelete(message.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
        </div>
    );
    
    return (
        <div className={cn("flex w-full gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
            {/* Avatar for other users */}
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
                <div className={messageStyle}>
                    {/* The Action Menu (appears on hover) */}
                    <div className={cn("absolute top-[-16px] flex items-center bg-card border rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100", isCurrentUser ? "right-0" : "left-0")}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReplyClick(message)} title="Reply"><Reply className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(p => !p)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
                        {isCurrentUser && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        )}
                        {(isCurrentUser || canModerate) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={handleDelete} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                    </div>
                    
                    {/* Emoji Picker (appears when reaction button is clicked) */}
                    {showPicker && <div className="absolute top-0 z-10 -translate-y-full mb-1"><EmojiPicker onSelect={handleReaction} /></div>}

                    {/* The actual message content (text or edit form) */}
                    {messageContent}
                </div>

                {/* Reactions Bar (appears below the bubble if reactions exist) */}
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
            
            {/* Avatar for the current user */}
            {isCurrentUser && (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
);
