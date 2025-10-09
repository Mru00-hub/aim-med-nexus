// In src/components/messaging/MessageInput.tsx

import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MessageWithDetails } from '@/integrations/supabase/community.api';

interface MessageInputProps {
  threadId: string;
  onSendMessage: (body: string, parentMessageId: number | null, files: File[]) => Promise<void>;
  replyingTo: MessageWithDetails | null;
  onCancelReply: () => void;
}

// We have temporarily removed React.memo for this test to eliminate all variables.
export const MessageInput: React.FC<MessageInputProps> = ({ 
    threadId, 
    onSendMessage, 
    replyingTo,
    onCancelReply
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This function now only updates the state. No alerts.
    if (e.target.files && e.target.files.length > 0) {
        setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        e.target.value = '';
    }
  };

  const handleSend = async () => {
    const trimmedBody = body.trim();
    if (trimmedBody === '' && attachedFiles.length === 0 || isSending) return;
    
    setIsSending(true);

    try {
      // UPDATE: Call the new onSendMessage prop with the files.
      // The parent component now handles all optimistic logic and API calls.
      await onSendMessage(trimmedBody, replyingTo?.id || null, attachedFiles);
      
      // Clear the input fields on success
      setBody(''); 
      setAttachedFiles([]);
      onCancelReply();

    } catch (error: any) {
      console.error("MessageInput failed to send:", error);
      // The parent component (ThreadView) will show the primary error toast.
      // We can keep this one as a fallback if needed.
      toast({ variant: 'destructive', title: 'Error', description: 'Your message could not be sent.' });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
        
        {/* ================================================================ */}
        {/* THIS IS OUR VISUAL DEBUGGER. Watch this text.                  */}
        {/* ================================================================ */}
        <div style={{ padding: '10px', border: '2px solid red', backgroundColor: '#fee' }}>
            <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2rem' }}>
                DEBUG: Number of attached files: {attachedFiles.length}
            </p>
        </div>
        {/* ================================================================ */}

        {/* The rest of the UI remains for context */}
        <div className="relative flex items-end gap-2">
            <input 
                type="file" 
                onChange={handleFileChange} 
                className="sr-only" 
                id="file-upload-test"
                multiple 
            />
            <label 
                htmlFor="file-upload-test" 
                className="cursor-pointer p-2 border rounded-md self-end inline-flex items-center justify-center h-10 w-10"
            >
                <Paperclip className="h-5 w-5" />
            </label>
            
            <Textarea
                placeholder="Type your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow resize-none max-h-40 min-h-[40px] pt-3"
                disabled={isSending}
                rows={1}
            />
            
            <Button 
                onClick={handleSend} 
                disabled={!profile || isSending}
                className="self-end h-10 w-10 p-2"
                size="icon"
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
