import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
    MessageWithDetails, 
    addReaction, 
    removeReaction,
    editMessage
} from '@/integrations/supabase/community.api'; 
import { UserProfileCard } from '@/components/ui/UserProfileCard';
import { Reply, Trash2, Pencil, Paperclip, SmilePlus } from 'lucide-react';

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
    <div className="flex gap-1 p-1 bg-white border rounded-full shadow-lg">
        {['👍', '❤️', '🔥', '🤔', '😂'].map(emoji => (
            <span key={emoji} className="cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors" onClick={() => onSelect(emoji)}>{emoji}</span>
        ))}
    </div>
);

interface MessageProps {
    message: MessageWithDetails;
    currentUserId: string;
    refetchMessages: () => Promise<void>;
    onReplyClick: (message: MessageWithDetails) => void;
    onDelete: (messageId: number) => void;
    // --- NEW: Prop to receive the quoted message details ---
    replyTo?: {
        author: string;
        body: string;
    } | null;
}

export const Message: React.FC<MessageProps> = ({ 
    message, 
    currentUserId, 
    refetchMessages, 
    onReplyClick,
    onDelete,
    replyTo
}) => {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedBody, setEditedBody] = useState(message.body);
    const [showPicker, setShowPicker] = useState(false);

    const isCurrentUser = message.user_id === currentUserId;
    const displayName = message.author?.full_name || 'User';
    const avatarUrl = message.author?.profile_picture_url;
    const canModerate = false; 

    const reactionCounts = useMemo(() => {
        return message.reactions.reduce((acc, reaction) => {
            acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.reactions]);

    const handleReaction = async (emoji: string) => {
        try {
            const existingReaction = message.reactions.find(r => r.user_id === currentUserId && r.reaction_emoji === emoji);
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
    
    const handleDelete = () => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        onDelete(message.id);
    };

    const handleEditSave = async () => {
        if (editedBody.trim() && editedBody !== message.body) {
            try {
                await editMessage(message.id, editedBody);
                toast({ title: 'Updated', description: 'Message edited successfully.' });
                await refetchMessages();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            } finally {
                setIsEditing(false);
            }
        } else {
            setIsEditing(false);
        }
    };
    
    const handleReply = () => { onReplyClick(message); };

    const messageContent = isEditing ? (
        <div className="flex flex-col gap-2 w-full"><Textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)} autoFocus rows={4} /><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button><Button size="sm" onClick={handleEditSave} disabled={!editedBody.trim()}>Save</Button></div></div>
    ) : (
        <p className="text-sm break-words whitespace-pre-wrap">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
    );
    
    const messageStyle = cn("flex flex-col rounded-xl px-3 py-2 max-w-lg shadow-sm", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-card border");

    const ActionMenu = () => (
        <div className={cn("absolute top-0 -mt-4 flex items-center bg-card border rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100", isCurrentUser ? "right-0" : "left-0")}>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReply} title="Reply"><Reply className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(!showPicker)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
            {isCurrentUser && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit"><Pencil className="h-4 w-4" /></Button>}
            {(isCurrentUser || canModerate) && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={handleDelete} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
        </div>
    );
    
    return (
        <div className={cn("flex w-full gap-3 group relative", isCurrentUser ? "justify-end" : "justify-start")}>
            {!isCurrentUser && (<Avatar className="mt-auto h-8 w-8"><AvatarImage src={avatarUrl ?? undefined} alt={displayName} /><AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}

            <div className="flex flex-col">
                {!isCurrentUser && (<span className="font-bold text-xs text-muted-foreground mb-1">{displayName}</span>)}
                <div className={messageStyle}>
                    {/* --- NEW: Quoted Reply Block --- */}
                    {replyTo && (
                        <div className="border-l-2 border-current/50 pl-2 mb-2 opacity-80">
                            <p className="text-xs font-bold">{replyTo.author}</p>
                            <p className="text-xs truncate">{replyTo.body}</p>
                        </div>
                    )}

                    {messageContent}
                    {message.attachments?.length > 0 && (<div className="mt-2 pt-2 border-t border-current/20">{/* attachments */}</div>)}
                    {Object.keys(reactionCounts).length > 0 && (<div className="mt-2 flex gap-1 pt-1">{/* reactions */}</div>)}
                </div>
            </div>
            
            {isCurrentUser && (<Avatar className="mt-auto h-8 w-8"><AvatarImage src={avatarUrl ?? undefined} alt={displayName} /><AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}
            
            {/* Unified Action Menu */}
            <ActionMenu />

            {showPicker && (<div className="absolute top-0 z-10 -translate-y-full mb-1"><EmojiPicker onSelect={handleReaction} /></div>)}
        </div>
    );
};
