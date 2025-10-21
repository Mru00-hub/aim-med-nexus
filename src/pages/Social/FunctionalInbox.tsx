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
import { ConversationList } from '@/components/social/ConversationList';
import { ConversationView } from '@/components/social/ConversationView';

type Conversation = Database['public']['Functions']['inbox_conversations']['Returns'][0];
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
      const { data, error } = await supabase.from('inbox_conversations').select('*');
      if (error) throw error;

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
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
        if (status === 'SUBSCRIBED') {
          fetchAndSetConversations();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn('Supabase subscription closed or errored, scheduling reconnect...');
          // Attempt soft reconnection after 3s
          setTimeout(() => {
            if (user) {
              supabase.removeChannel(channel);
              console.log('Reconnecting to Supabase inbox channel...');
              supabase
                .channel(`inbox-updates-${user.id}`)
                .on<DirectMessagePayload>(
                  'postgres_changes',
                  { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                  () => triggerDebouncedFetch()
                )
                .subscribe();
            }
          }, 3000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log('Supabase inbox subscription cleaned up.');
    };
  }, [user?.id, authLoading, triggerDebouncedFetch, fetchAndSetConversations]);

  // --- Handle Conversation Selection ---
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setOptimisticUpdateInProgress(true);
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === conversation.conversation_id
          ? { ...c, unread_count: 0 }
          : c
      )
    );
    setTimeout(() => setOptimisticUpdateInProgress(false), 1000);
  }, []);

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
          <Card className="card-medical lg:col-span-1 flex flex-col max-h-[700px]">
            <ConversationList
              conversations={conversations}
              loading={loading}
              onSelectConversation={handleSelectConversation}
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
