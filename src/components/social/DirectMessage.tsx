import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { SmilePlus, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '../ui/badge';

type Profile = Tables<'profiles'>;
type MessageWithRelations = Tables<'direct_messages'> & {
  direct_message_reactions: Tables<'direct_message_reactions'>[];
};

interface DirectMessageProps {
  message: MessageWithRelations;
  authorProfile: Profile | undefined;
  recipientProfile: Profile | undefined;
}

export const DirectMessage = ({ message, authorProfile, recipientProfile }: DirectMessageProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [showActions, setShowActions] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const isMe = message.sender_id === user?.id;
    const profile = isMe ? authorProfile : recipientProfile;
    
    const reactionCounts = useMemo(() => {
        return (message.direct_message_reactions || []).reduce((acc, reaction) => {
            acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.direct_message_reactions]);

    const handleReaction = async (emoji: string) => {
        setShowPicker(false);
        await socialApi.messaging.toggleReaction(message.id, emoji);
        // UI updates are handled by the real-time subscription in ConversationView
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure?")) return;
        await socialApi.messaging.deleteMessage(message.id);
    };

    const handleSaveEdit = async () => {
        if (!editedContent.trim() || editedContent.trim() === message.content) {
            setIsEditing(false);
            return;
        }
        await socialApi.messaging.editMessage(message.id, editedContent.trim());
        setIsEditing(false);
    };
    
    const messageStyle = cn(
        "flex flex-col rounded-xl px-4 py-3 max-w-[85%] shadow-sm group relative",
        isMe 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border"
    );

    return (
        <div 
            className={cn("flex w-full gap-3", isMe ? "justify-end" : "justify-start")}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {!isMe && <Avatar className="h-8 w-8"><AvatarImage src={profile?.profile_picture_url} /><AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback></Avatar>}
            
            <div className={cn("flex flex-col w-full relative", isMe ? "items-end" : "items-start")}>
                <div className={messageStyle}>
                    {isEditing ? (
                        <div className="w-64">
                            <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} autoFocus rows={3} className="bg-background text-foreground" />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm break-words whitespace-pre-wrap">{message.content} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
                    )}

                    {Object.keys(reactionCounts).length > 0 && (
                        <div className="absolute -bottom-3 right-2 flex gap-1">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <Badge key={emoji} variant="secondary" className="shadow-md cursor-pointer" onClick={() => handleReaction(emoji)}>
                                    {emoji} {count}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                 {showActions && (
                    <div className={cn( "absolute z-10 flex items-center bg-card border rounded-full shadow-md top-[-16px]", isMe ? "left-0" : "right-0")}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPicker(p => !p)} title="Add Reaction"><SmilePlus className="h-4 w-4" /></Button>
                        {isMe && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit"><Pencil className="h-4 w-4" /></Button>}
                        {isMe && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                )}
                {showPicker && <div className="absolute top-0 z-20 flex gap-1 p-1 bg-background border rounded-full shadow-lg"><span onClick={() => handleReaction('👍')}>👍</span> <span onClick={() => handleReaction('❤️')}>❤️</span></div>}
            </div>
            
            {isMe && <Avatar className="h-8 w-8"><AvatarImage src={profile?.profile_picture_url} /><AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback></Avatar>}
        </div>
    );
};
