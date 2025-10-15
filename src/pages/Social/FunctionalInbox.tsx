import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { socialApi } from '@/integrations/supabase/social.api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

import { ConversationList } from '@/components/social/ConversationList';
import { ConversationView } from '@/components/social/ConversationView';

type Conversation = Tables<'inbox_conversations'> & { is_starred?: boolean };
type DirectMessagePayload = Tables<'direct_messages'>;

const FunctionalInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { setUnreadInboxCount } = useSocialCounts();
  const location = useLocation();

  const fetchAndSetConversations = async () => {
    setLoading(true);
    const { data } = await socialApi.messaging.getInbox();
    if (data) {
      // Sort conversations to show starred ones at the top
      data.sort((a, b) => (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0));
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  };

  // Effect to update the global unread count
  useEffect(() => {
    const totalUnread = conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);
    setUnreadInboxCount(totalUnread);
  }, [conversations, setUnreadInboxCount]);

  useEffect(() => {
    fetchAndSetConversations(); // Initial fetch

    const channel = supabase
      .channel('public:direct_messages')
      .on<DirectMessagePayload>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          // A new message should always trigger a refetch to update order and content
          fetchAndSetConversations();
        }
      )
      .subscribe();
      
      return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const navState = location.state as { conversationId?: string; participant?: any };
    const conversationIdFromState = navState?.conversationId;
    if (!conversationIdFromState) return;

    const convoInList = conversations.find(c => c.conversation_id === conversationIdFromState);

    if (convoInList) {
      setSelectedConversation(convoInList);
      window.history.replaceState({}, document.title);
    } else if (!loading && navState.participant) {
      const phantomConversation: Conversation = {
        conversation_id: conversationIdFromState,
        last_message_at: new Date().toISOString(),
        last_message_content: "Start the conversation!",
        participant_avatar_url: navState.participant.profile_picture_url,
        participant_full_name: navState.participant.full_name,
        participant_id: navState.participant.id,
        unread_count: 0,
        updated_at: new Date().toISOString(),
        is_starred: false, // Ensure phantom conversations have the property
      };
      setConversations(prev => [phantomConversation, ...prev]);
      setSelectedConversation(phantomConversation);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations, loading]);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Inbox</h1>
          <p className="text-muted-foreground text-lg">
            Private messages and professional communication with your network.
          </p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6 min-h-[700px] animate-slide-up">
          <Card className="card-medical lg:col-span-1 flex flex-col max-h-[700px]">
            <ConversationList 
              conversations={conversations}
              loading={loading}
              onSelectConversation={setSelectedConversation}
              selectedConversationId={selectedConversation?.conversation_id || null}
            />
          </Card>
          <Card className="card-medical lg:col-span-3 flex flex-col">
            {selectedConversation ? (
              <ConversationView 
                conversation={selectedConversation} 
                onConversationUpdate={fetchAndSetConversations}
              />
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FunctionalInbox;
