import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MessageSummarizerProps {
  threadId?: string;
  messages?: Array<{
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
  }>;
}

const MessageSummarizer: React.FC<MessageSummarizerProps> = ({ 
  threadId, 
  messages = [] 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  // Count unread messages
  const unreadCount = messages.filter(msg => 
    !msg.is_read && msg.sender_id !== user?.id
  ).length;

  const handleSummarize = async () => {
    if (!user || !threadId) {
      toast({
        title: "Error",
        description: "Please log in and select a conversation.",
        variant: "destructive",
      });
      return;
    }

    if (unreadCount === 0) {
      toast({
        title: "No unread messages",
        description: "All messages in this conversation have been read.",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the existing summarize-unread-messages edge function
      const { data, error } = await supabase.functions.invoke(
        'summarize-unread-messages',
        {
          body: { thread_id: threadId }
        }
      );

      if (error) {
        console.error('Summarization error:', error);
        toast({
          title: "Summarization Failed",
          description: error.message || "Failed to summarize messages.",
          variant: "destructive",
        });
        return;
      }

      setSummary(data.summary || 'No summary available.');
      
      toast({
        title: "Summary Generated",
        description: `Successfully summarized ${unreadCount} unread messages.`,
      });

    } catch (error: any) {
      console.error('Error calling summarization function:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="card-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Message Summary
        </CardTitle>
        <CardDescription>
          Quickly catch up on unread messages using AI summarization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>
              {unreadCount > 0 
                ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                : 'All messages read'
              }
            </span>
          </div>
          
          <Button 
            onClick={handleSummarize}
            disabled={loading || unreadCount === 0}
            size="sm"
            className="btn-medical"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Summarize
              </>
            )}
          </Button>
        </div>

        {summary && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Summary</label>
            <Textarea 
              value={summary}
              readOnly
              className="min-h-[120px] resize-none bg-muted/30"
              placeholder="AI summary will appear here..."
            />
          </div>
        )}

        {!summary && !loading && (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Click "Summarize" to get an AI-powered summary of unread messages
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageSummarizer;