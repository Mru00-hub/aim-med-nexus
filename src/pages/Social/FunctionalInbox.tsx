import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { socialApi } from '@/integrations/supabase/social.api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Import the new, corrected child components
import { ConversationList } from '@/components/social/ConversationList';
import { ConversationView } from '@/components/social/ConversationView';

type Conversation = Tables<'inbox_conversations'>;
type DirectMessagePayload = Tables<'direct_messages'>;

const FunctionalInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { setUnreadInboxCount } = useSocialCounts();
  const location = useLocation();

  useEffect(() => {
    // This effect calculates and updates the global unread count whenever conversations change
    const totalUnread = conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);
    setUnreadInboxCount(totalUnread);
  }, [conversations, setUnreadInboxCount]);

  useEffect(() => {
    // This effect handles auto-selecting a conversation from navigation state
    const conversationIdFromState = location.state?.conversationId;
    if (conversationIdFromState && conversations.length > 0 && !loading) {
      const convoToSelect = conversations.find(c => c.conversation_id === conversationIdFromState);
      if (convoToSelect) {
        setSelectedConversation(convoToSelect);
        // Clear the state so it doesn't re-trigger on other renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, conversations, loading]);

  useEffect(() => {
    // Function to fetch the initial list of conversations
    const fetchInbox = async () => {
      setLoading(true);
      const { data } = await socialApi.messaging.getInbox();
      if (data) {
        setConversations(data);
      }
      setLoading(false);
    };

    fetchInbox();

    // Set up real-time subscription for new messages to update the conversation list
    const channel = supabase
      .channel('public:direct_messages')
      .on<DirectMessagePayload>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const newMessage = payload.new;
          setConversations(currentConvos => {
            const convoIndex = currentConvos.findIndex(c => c.conversation_id === newMessage.conversation_id);
            
            // If the conversation exists, update it and move it to the top
            if (convoIndex > -1) {
              const updatedConvo = {
                ...currentConvos[convoIndex],
                last_message_content: newMessage.content,
                last_message_at: newMessage.created_at,
                // Increment unread count only if the conversation is not currently selected
                unread_count: selectedConversation?.conversation_id !== newMessage.conversation_id
                  ? (currentConvos[convoIndex].unread_count || 0) + 1
                  : 0,
              };
              const newConvos = [...currentConvos];
              newConvos.splice(convoIndex, 1);
              return [updatedConvo, ...newConvos];
            }
            
            // If it's a new conversation not yet in our list, refetch everything to get full details.
            fetchInbox();
            return currentConvos;
          });
        }
      )
      .subscribe();
      
      // Clean up the subscription on component unmount
      return () => { supabase.removeChannel(channel); };
  }, [selectedConversation]); // Re-run effect if selectedConversation changes to update unread count logic

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
              <ConversationView conversation={selectedConversation} />
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
