// components/messaging/Message.tsx

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth'; // To identify if the message is from the current user
import { cn } from '@/lib/utils'; // A utility for conditional class names

// Import our new, official type
import { MessageWithAuthor } from '@/integrations/supabase/community.api';

interface MessageProps {
  message: MessageWithAuthor;
}

export const Message = ({ message }: MessageProps) => {
  const { user } = useAuth();
  const isCurrentUser = message.user_id === user?.id;

  return (
    <div className={cn(
        "flex items-start gap-3 p-3 rounded-md",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar>
        {/* Using a simple, consistent avatar service */}
        <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${message.email}`} alt={message.email} />
        <AvatarFallback>{message.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className={cn(
          "flex flex-col rounded-lg px-3 py-2 bg-muted max-w-lg",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <div className="flex items-center gap-2">
          {!isCurrentUser && <span className="font-bold text-sm">{message.email}</span>}
          <span className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm">{message.body} {message.is_edited && <span className="text-xs opacity-70">(edited)</span>}</p>
      </div>
    </div>
  );
};
