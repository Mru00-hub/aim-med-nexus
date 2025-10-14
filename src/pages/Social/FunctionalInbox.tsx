import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { 
  MessageCircle, 
  Send, 
  Paperclip,
  Smile,
  Search,
  MoreVertical,
  Star
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import TimeAgo from 'react-timeago'; // A helpful library for relative timestamps

type Conversation = Tables<'inbox_conversations'>;
type Message = Tables<'direct_messages'>;

const FunctionalInbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState({ inbox: true, messages: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial list of conversations
  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(prev => ({ ...prev, inbox: true }));
      const { data } = await socialApi.messaging.getInbox();
      if (data) {
        setConversations(data);
      }
      setLoading(prev => ({ ...prev, inbox: false }));
    };
    fetchInbox();
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation?.conversation_id) return;
      
      setLoading(prev => ({ ...prev, messages: true }));
      setMessages([]); // Clear previous messages
      const { data } = await socialApi.messaging.getMessagesForConversation(selectedConversation.conversation_id);
      if (data) {
        setMessages(data);
      }
      setLoading(prev => ({ ...prev, messages: false }));
    };
    
    fetchMessages();
  }, [selectedConversation]);
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;
  
    channelRef.current = supabase
      .channel('direct_messages')
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const newMessage = payload.new;
          
          if (newMessage.conversation_id === selectedConversation?.conversation_id) {
            setMessages(currentMessages => [...currentMessages, newMessage]);
          }
          
          setConversations(currentConvos => {
              const convoIndex = currentConvos.findIndex(c => c.conversation_id === newMessage.conversation_id);
              if (convoIndex > -1) {
                  const updatedConvo = {
                      ...currentConvos[convoIndex],
                      last_message_content: newMessage.content,
                      last_message_at: newMessage.created_at,
                      unread_count: (currentConvos[convoIndex].unread_count || 0) + 1
                  };
                  const newConvos = [...currentConvos];
                  newConvos.splice(convoIndex, 1);
                  return [updatedConvo, ...newConvos];
              }
              return currentConvos;
          });
        }
      )
      .subscribe();
      
    return () => {
      if(channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, selectedConversation]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?.conversation_id || !user) return;

    const { error } = await socialApi.messaging.sendMessage({
      conversation_id: selectedConversation.conversation_id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Failed to send message:", error);
    } else {
      setNewMessage('');
    }
  };

  const totalUnread = conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);

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

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 min-h-[700px] animate-slide-up">
          <Card className="card-medical lg:col-span-1 flex flex-col max-h-[700px]">
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
              {loading.inbox ? (
                <div className="p-3 space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((convo) => (
                    <div
                      key={convo.conversation_id}
                      onClick={() => setSelectedConversation(convo)}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                        selectedConversation?.conversation_id === convo.conversation_id 
                          ? 'bg-primary/5 border-l-primary' 
                          : 'border-l-transparent'
                      }`}
                    >
                       <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                                <img src={convo.participant_avatar_url || `https://i.pravatar.cc/40?u=${convo.participant_id}`} alt={convo.participant_full_name} className="w-10 h-10 rounded-full object-cover" />
                                {/* Note: Online status is not in the view, so this is a placeholder */}
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-medium text-sm truncate pr-2">{convo.participant_full_name}</h4>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {convo.last_message_at && <TimeAgo date={convo.last_message_at} />}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground truncate pr-2 flex-1">
                                        {convo.last_message_content}
                                    </p>
                                    {convo.unread_count > 0 && (
                                        <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs flex-shrink-0">
                                            {convo.unread_count}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="card-medical lg:col-span-3 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={selectedConversation.participant_avatar_url || `https://i.pravatar.cc/40?u=${selectedConversation.participant_id}`} alt={selectedConversation.participant_full_name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.participant_full_name}</h3>
                        <p className="text-sm text-muted-foreground">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8"><Star className="h-4 w-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                  {loading.messages ? (
                     <div className="flex justify-center items-center h-full text-muted-foreground">Loading messages...</div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 text-right ${message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        <p>This is the beginning of your conversation.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                
                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[40px] max-h-32 resize-none"
                    />
                    <Button type="submit" size="sm" className="btn-medical" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
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
