// src/pages/Social/FunctionalInbox.tsx

import React, { useState, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // FIX: Import useToast for error handling
import { getInbox, Conversation } from '@/integrations/supabase/social.api'; // FIX: Import new standalone function and type
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

import { ConversationList } from '@/components/social/ConversationList';
import { ConversationView } from '@/components/social/ConversationView';

type DirectMessagePayload = Tables<'direct_messages'>;

const FunctionalInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { setUnreadInboxCount } = useSocialCounts();
  const { toast } = useToast(); // FIX: Initialize toast
  const location = useLocation();

  // FIX: Refactored to use the new API style with try...catch error handling
  const fetchAndSetConversations = async () => {
    // Keep loading true at the start for subsequent fetches
    setLoading(true);
    try {
      const data = await getInbox();
      // Sort conversations to show starred ones at the top
      data.sort((a, b) => (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0));
      setConversations(data);
    } catch (error: any) {
        console.error("Failed to fetch inbox:", error);
        toast({ title: "Error", description: "Could not load your inbox.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  // This effect remains the same and is correct.
  useEffect(() => {
    const totalUnread = conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);
    setUnreadInboxCount(totalUnread);
  }, [conversations, setUnreadInboxCount]);

  // This effect for real-time updates is also correct.
  useEffect(() => {
    fetchAndSetConversations(); // Initial fetch

    const channel = supabase
      .channel('public:direct_messages_inbox') // Give it a more specific channel name
      .on<DirectMessagePayload>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          fetchAndSetConversations();
        }
      )
      .subscribe();
      
      return () => { supabase.removeChannel(channel); };
  }, []);

  const handleMarkAsRead = async (conversationId: string) => {
    // 1. OPTIMISTIC UPDATE: Immediately update the local state.
    setConversations(prevConvos =>
      prevConvos.map(convo =>
        convo.conversation_id === conversationId
          ? { ...convo, unread_count: 0 } // Instantly set the count to zero
          : convo
      )
    );

    // 2. BACKGROUND TASK: Tell the database to make the change permanent.
    // We don't need to wait for this to finish.
    try {
      await supabase.rpc('mark_conversation_as_read', { 
        p_conversation_id: conversationId 
      });
      // We don't even need to refetch here, because our local state is already correct!
    } catch (error) {
      console.error("Failed to mark conversation as read in the background:", error);
      toast({
        title: "Error",
        description: "Could not mark messages as read. Please try again.",
        variant: "destructive",
      });
      
      // Set the conversation's unread_count back to its original value.
      setConversations(prevConvos =>
        prevConvos.map(convo =>
          convo.conversation_id === conversationId
            ? { ...convo, unread_count: originalUnreadCount }
            : convo
        )
      );
    }
  };
  
  // This effect for handling navigation state is also correct.
  useEffect(() => {
    const navState = location.state as { conversationId?: string; participant?: any };
    if (!navState?.conversationId) return;

    const convoInList = conversations.find(c => c.conversation_id === navState.conversationId);

    if (convoInList) {
      setSelectedConversation(convoInList);
    } else if (!loading && conversations.length > 0 && navState.participant) {
      // Create a temporary "phantom" conversation to show in the UI until the real one loads
      const phantomConversation: Conversation = {
        conversation_id: navState.conversationId,
        last_message_at: new Date().toISOString(),
        last_message_content: "Start the conversation!",
        participant_avatar_url: navState.participant.profile_picture_url,
        participant_full_name: navState.participant.full_name,
        participant_id: navState.participant.id,
        unread_count: 0,
        updated_at: new Date().toISOString(),
        is_starred: false,
      };
      setConversations(prev => [phantomConversation, ...prev]);
      setSelectedConversation(phantomConversation);
    }
    // Clear the location state after handling it
    window.history.replaceState({}, document.title);
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
                onMarkAsRead={handleMarkAsRead}
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
