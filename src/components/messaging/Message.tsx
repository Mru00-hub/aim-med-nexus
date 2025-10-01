// components/messaging/Message.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth'; // To identify if the message is from the current user
import { cn } from '@/lib/utils'; // A utility for conditional class names
// Import our new, official type
import { MessageWithAuthor } from '@/integrations/supabase/types';
import { UserProfileCard } from '@/components/ui/UserProfileCard';

interface MessageProps {
  message: MessageWithAuthor;
}

export const Message = ({ message }: MessageProps) => {
  const { user } = useAuth();
  const isCurrentUser = message.user_id === user?.id;
  const displayName = message.author?.full_name || message.email || 'User';
  const avatarUrl = message.author?.profile_picture_url; // Use the profile picture from the joined table

  return (
    <div className={cn(
        "flex items-start gap-3 p-3 rounded-md",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar>
        {/* Using a simple, consistent avatar service */}
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
          {!isCurrentUser && (
            // Wrap the display name with our new interactive card
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
    </div>
  );
};
