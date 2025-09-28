import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon,
  Smile,
  Reply,
  Heart,
  ThumbsUp,
  Laugh
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Message {
  id: number;
  body: string;
  sender_id: string;
  created_at: string;
  thread_id: number;
  is_read: boolean;
  sender_profile?: {
    full_name: string;
    profile_picture_url?: string;
  };
  reactions?: Array<{
    id: string;
    reaction_emoji: string;
    user_id: string;
  }>;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

interface ThreadChatProps {
  threadId: number;
  threadTitle: string;
  onBack: () => void;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: Heart, label: 'Love' },
  { emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { emoji: '😂', icon: Laugh, label: 'Laugh' }
];

export const ThreadChat: React.FC<ThreadChatProps> = ({ threadId, threadTitle, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReactions, setShowReactions] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch additional data separately to avoid relation issues
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, profile_picture_url')
            .eq('id', message.sender_id)
            .single();

          // Fetch reactions
          const { data: reactions } = await supabase
            .from('message_reactions')
            .select('id, reaction_emoji, user_id')
            .eq('message_id', message.id);

          // Fetch attachments
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('id, file_url, file_name, file_type')
            .eq('message_id', message.id);

          return {
            ...message,
            sender_profile: profile || { full_name: 'Unknown User' },
            reactions: reactions || [],
            attachments: attachments || []
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          body: newMessage.trim(),
          sender_id: user.id,
          thread_id: threadId,
          is_read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error in sendMessage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addReaction = async (messageId: number, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_emoji', emoji)
        .single();

      if (existingReaction) {
        // Remove existing reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add new reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_emoji: emoji
          });
      }

      setShowReactions(null);
      fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll just show an alert about file upload
    // In a real implementation, you'd upload to Supabase Storage
    alert('File upload functionality would be implemented here');
  };

  const getReactionCount = (messageReactions: any[], emoji: string) => {
    return messageReactions?.filter(r => r.reaction_emoji === emoji).length || 0;
  };

  const hasUserReacted = (messageReactions: any[], emoji: string) => {
    return messageReactions?.some(r => r.reaction_emoji === emoji && r.user_id === user?.id) || false;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-background/95 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg truncate">{threadTitle}</h2>
          <p className="text-sm text-muted-foreground">Public Thread</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id;
          const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
          
          return (
            <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'justify-end' : ''}`}>
              {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {message.sender_profile?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div className={`max-w-[70%] ${isOwnMessage ? 'order-first' : ''}`}>
                {showAvatar && !isOwnMessage && (
                  <p className="text-sm font-medium mb-1 px-1">
                    {message.sender_profile?.full_name || 'Unknown User'}
                  </p>
                )}
                
                <Card className={`${isOwnMessage ? 'bg-primary text-primary-foreground' : ''}`}>
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 rounded bg-muted/20">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-xs truncate">{attachment.file_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {REACTION_EMOJIS.map(({ emoji }) => {
                          const count = getReactionCount(message.reactions, emoji);
                          const userReacted = hasUserReacted(message.reactions, emoji);
                          
                          if (count === 0) return null;
                          
                          return (
                            <Badge
                              key={emoji}
                              variant={userReacted ? "default" : "secondary"}
                              className="text-xs cursor-pointer"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji} {count}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className={`flex items-center gap-2 mt-1 px-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(new Date(message.created_at), new Date(), { addSuffix: true })}
                  </span>
                  
                  {!isOwnMessage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                      >
                        <Smile className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Reaction Picker */}
                {showReactions === message.id && (
                  <div className="flex gap-1 mt-2 p-2 bg-muted rounded-md">
                    {REACTION_EMOJIS.map(({ emoji, label }) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => addReaction(message.id, emoji)}
                        title={label}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {user && (
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
            />
            
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <div className="p-4 border-t border-border bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Please sign in to participate in the conversation
          </p>
        </div>
      )}
    </div>
  );
};