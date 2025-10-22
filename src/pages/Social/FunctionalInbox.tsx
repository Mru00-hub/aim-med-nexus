import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { ConversationList } from '@/components/social/ConversationList';
import { ConversationView } from '@/components/social/ConversationView';
import { markConversationAsRead, getInbox } from '@/integrations/supabase/social.api';

type Conversation = Database['public']['Functions']['get_my_inbox_conversations']['Returns'][number];
type DirectMessagePayload = Tables<'direct_messages'>;

const FunctionalInbox = () => {
  const { user, loading: authLoading } = useAuth();
  const { setUnreadInboxCount } = useSocialCounts();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [optimisticUpdateInProgress, setOptimisticUpdateInProgress] = useState(false);

  // --- Ref guard to prevent overlapping fetches ---
  const isFetchingRef = useRef(false);

  // --- Stable Callback: Fetch Conversations ---
  const fetchAndSetConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const data = await getInbox();
      
      // The rest of your logic is perfect and doesn't need to change
      data.sort((a, b) => (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0));
      setConversations(data);
    } catch (error: any) {
      console.error('Failed to fetch inbox:', error);
      toast({
        title: 'Error',
        description: 'Could not load your inbox.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]);

  // --- Stable Debounced Wrapper ---
  const optimisticRef = useRef(optimisticUpdateInProgress);
  useEffect(() => {
    optimisticRef.current = optimisticUpdateInProgress;
  }, [optimisticUpdateInProgress]);

  // --- Stable Debounced Wrapper ---
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const triggerDebouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Use the ref here to get the *current* value
      if (!optimisticRef.current) {
        fetchAndSetConversations();
      }
    }, 500);
  }, [fetchAndSetConversations]); 

  // --- Update unread counts when conversations change ---
  useEffect(() => {
    const unreadCount = conversations.reduce(
      (acc, convo) => acc + ((convo.unread_count || 0) > 0 ? 1 : 0),
      0
    );
    setUnreadInboxCount(unreadCount);
  }, [conversations, setUnreadInboxCount]);

  // --- Subscription Setup (stable once per user) ---
  useEffect(() => {
    if (authLoading || !user) return;

    const channel = supabase
      .channel(`inbox-updates-${user.id}`)
      .on<DirectMessagePayload>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        () => triggerDebouncedFetch()
      )
      .subscribe((status, err) => { // You can optionally get the error object
        console.log('Supabase subscription status:', status);

        if (status === 'SUBSCRIBED') {
          // This is the ideal state, fetch the latest data
          fetchAndSetConversations();
        }

        if (status === 'CHANNEL_ERROR') {
          // Log the specific error
          console.error('Supabase channel error:', err);
          // Optionally, show a toast to the user
          toast({
             title: 'Connection Error',
             description: 'There was a problem with the live connection.',
             variant: 'destructive',
          });
        }

        if (status === 'CLOSED') {
          // This just means the channel is closed.
          // The client will handle reconnecting automatically.
          console.warn('Supabase subscription closed. Client will attempt to reconnect...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log('Supabase inbox subscription cleaned up.');
    };
  }, [user?.id, authLoading, triggerDebouncedFetch, fetchAndSetConversations]);

  // --- Handle Conversation Selection ---
  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    setOptimisticUpdateInProgress(true);
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conversation.conversation_id
          ? { ...c, unread_count: 0 }
          : c
      )
    );  
    try {
      // Only call the API if it was actually unread
      if (conversation.unread_count > 0) {
        await markConversationAsRead(conversation.conversation_id);
        // We don't need to re-fetch here, as our optimistic update
        // and subscriptions will handle the UI.
      }
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      // Optional: Rollback optimistic update on failure
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === conversation.conversation_id
            ? { ...c, unread_count: conversation.unread_count } // Revert to old count
            : c
        )
      );
      toast({
        title: 'Error',
        description: 'Could not mark message as read.',
        variant: 'destructive',
      });
    } finally {
      // Set optimistic update to false *after* API call finishes
      setTimeout(() => setOptimisticUpdateInProgress(false), 500); // 500ms is safer
    }
  }, [toast]);
  
  // --- Render UI ---
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
          <Card className={cn(
            "card-medical lg:col-span-1 flex flex-col max-h-[700px]",
            selectedConversation ? "hidden lg:flex" : "flex"
          )}>
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.conversation_id || null}
            />
          </Card>

          <Card className={cn(
            "card-medical lg:col-span-3 flex flex-col",
            selectedConversation ? "flex" : "hidden lg:flex"
          )}>
            {selectedConversation ? (
              <ConversationView
                conversation={selectedConversation}
                onConversationUpdate={fetchAndSetConversations}
                onBack={() => setSelectedConversation(null)}
              />
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
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
