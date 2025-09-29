// src/components/messaging/Message.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageWithAuthor } from '@/types/forum'; // We'll define this type soon

// In src/integrations/supabase/types.ts, add this helper type
// export type MessageWithAuthor = Database['public']['Functions']['get_messages']['Returns'][number];

interface MessageProps {
  message: MessageWithAuthor;
}

export const Message = ({ message }: MessageProps) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50">
      <Avatar>
        <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${message.email}`} alt={message.email ?? 'User'} />
        <AvatarFallback>{message.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-bold">{message.email}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at!).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-foreground/90">{message.body}</p>
      </div>
    </div>
  );
};
