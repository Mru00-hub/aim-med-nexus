import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MessageWithDetails } from '@/integrations/supabase/community.api';

// NOTE: This component is designed to be passed the full list of messages 
// and its logic is now contained entirely in the Edge Function, as is the 
// most robust way to handle RLS and unread status filtering.

interface MessageSummarizerProps {
  /** The ID of the thread to summarize. Mandatory for the Edge Function call. */
  threadId: string;
  /** The full list of messages from the ThreadView component. */
  messages: MessageWithDetails[];
  /** The ID of the currently selected space (used for context, not strictly needed for API) */
  spaceId?: string;
}

const MessageSummarizer: React.FC<MessageSummarizerProps> = ({ 
  threadId, 
  messages 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NOTE: Since the frontend cannot reliably determine 'is_read' status (it's a backend concern),
  // we focus on summarizing the LATEST 20 messages for context, and let the backend 
  // Edge Function handle true 'unread' status filtering if needed.
  const latestMessages = messages.slice(-20);
  const messageCount = latestMessages.length;


  const handleSummarize = useCallback(async () => {
    if (!user || !threadId) {
      toast({
        title: "Error",
        description: "Please log in and select a conversation.",
        variant: "destructive",
      });
      return;
    }
    
    // Safety check if thread is empty
    if (messageCount === 0) {
        toast({
            title: "No messages to summarize",
            description: "The thread is currently empty.",
        });
        return;
    }

    setLoading(true);
    setSummary('');

    try {
      // Data sent to the Edge Function. 
      // The function must use thread_id and the user's JWT (automatically passed by Supabase) 
      // to query the database, filter by read status, and generate the summary.
      const { data, error } = await supabase.functions.invoke(
        'summarize-unread-messages',
        {
          body: { 
            thread_id: threadId,
            // OPTIONAL: Pass the latest message text as context if the Edge Function needs it
            // latest_messages: latestMessages.map(m => m.body), 
          },
          method: 'POST'
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
      
      // Ensure data.summary exists (assuming the Edge Function returns { summary: string })
      if (data && data.summary) {
          setSummary(data.summary);
          toast({
            title: "Summary Generated",
            description: "Successfully summarized unread messages.",
          });
      } else {
           setSummary('No unread messages found or summary could not be generated.');
           toast({
            title: "Info",
            description: "No new unread messages were found since your last visit.",
          });
      }

    } catch (error: any) {
      console.error('Error calling summarization function:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, threadId, messageCount, toast]);

  if (!user) return null;

  return (
    <Card className="shadow-lg border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          AI Thread Catch-Up
        </CardTitle>
        <CardDescription>
          Generate a concise summary of the unread portion of the discussion.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Display the total number of messages we are considering for context */}
            <span>
              Analyzing **{messageCount}** total message{messageCount !== 1 ? 's' : ''} for new content.
            </span>
          </div>
          
          <Button 
            onClick={handleSummarize}
            disabled={loading || messageCount === 0}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Catch Up
              </>
            )}
          </Button>
        </div>

        {summary && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-indigo-600">AI Summary</label>
            <Textarea 
              value={summary}
              readOnly
              className="min-h-[120px] resize-none bg-indigo-50/50 border-indigo-200 shadow-inner"
              placeholder="AI summary will appear here..."
            />
          </div>
        )}

        {!summary && !loading && (
          <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
            <p className="text-sm">
              Click **Catch Up** to process the thread history.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageSummarizer;
