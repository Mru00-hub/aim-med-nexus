import React, { useState, useEffect, useMemo } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Lock } from 'lucide-react';
import type { Tables, Database } from '@/integrations/supabase/types';
import TimeAgo from 'react-timeago';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

type Conversation = Database['public']['Functions']['get_inbox_conversations']['Returns'][0];

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
}

export const ConversationList = ({ conversations, loading, onSelectConversation, selectedConversationId }: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(convo =>
      convo.participant_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

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
          <Input 
            placeholder="Search conversations..." 
            className="pl-10" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />

        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto flex-1">
        {loading ? ( <Skeleton className="h-16 w-full" /> ) : (
          <div className="space-y-1">
            {filteredConversations.map((convo) => (
              <div
                key={convo.conversation_id}
                onClick={() => onSelectConversation(convo)}
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${selectedConversationId === convo.conversation_id ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={convo.participant_avatar_url || undefined} />
                        <AvatarFallback>{convo.participant_full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm truncate pr-2">{convo.participant_full_name}</h4>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                {convo.last_message_at && <TimeAgo date={convo.last_message_at} />}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate pr-2 flex-1 flex items-center gap-1.5">
                              {convo.last_message_content ? (
                                <>
                                  <Lock className="h-3 w-3 flex-shrink-0" />
                                  <span>Encrypted Message</span>
                                </>
                              ) : (
                                <span>No messages yet</span>
                              )}
                            </p>
                            {convo.unread_count > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                                    {convo.unread_count}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                {convo.is_starred && (
                  <div className="ml-2 flex-shrink-0">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
};
