import React, { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { socialApi } from '@/integrations/supabase/social.api';
import { Tables } from '@/integrations/supabase/types';
import TimeAgo from 'react-timeago';

type Conversation = Tables<'inbox_conversations'>;

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
}

export const ConversationList = ({ onSelectConversation, selectedConversationId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      const { data } = await socialApi.messaging.getInbox();
      if (data) setConversations(data);
      setLoading(false);
    };
    fetchInbox();
    // In a production app, subscribe to a channel that notifies of new conversations
  }, []);

  const totalUnread = conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);

  return (
    <>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">Messages</CardTitle>
          {totalUnread > 0 && <Badge variant="destructive">{totalUnread} unread</Badge>}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" />
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            <Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((convo) => (
              <div
                key={convo.conversation_id}
                onClick={() => onSelectConversation(convo)}
                className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${selectedConversationId === convo.conversation_id ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}>
                {/* ... Conversation Item UI ... */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
};
