// components/messaging/Message.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MessageWithAuthor } from '@/integrations/supabase/community.api'; // Correct import path
import { UserProfileCard } from '@/components/ui/UserProfileCard';

interface MessageProps {
  message: MessageWithAuthor;
}

export const Message = ({ message }: MessageProps) => {
  const { user } = useAuth();
  const isCurrentUser = message.user_id === user?.id;

  const displayName = message.author?.full_name || message.email || 'User';
  const avatarUrl = message.author?.profile_picture_url;

  return (
    <div className={cn(
        "flex items-start gap-3 p-3 rounded-md",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar>
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
      </Avatar>

      {/* --- FIX START: Added a wrapping div for all the text content --- */}
      <div className={cn(
          "flex flex-col rounded-lg px-3 py-2 bg-muted max-w-lg",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <div className="flex items-center gap-2">
          {!isCurrentUser && (
            <UserProfileCard userId={message.user_id}>
              <span className="font-bold text-sm cursor-pointer hover:underline">
                {displayName}
              </span>
            </UserProfileCard>
          )}
          <span className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
      </div>
      {/* --- FIX END: The extra closing div from before is now correctly matched --- */}
      
    </div>
  );
};
