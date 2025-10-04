// src/components/messaging/MessageInput.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// No longer need these imports here
// import { postMessage } from '@/integrations/supabase/community.api';
// import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  threadId: string;
  // This is the new prop we will pass from the parent
  onSendMessage: (body: string) => Promise<void>;
}

export const MessageInput = ({ threadId, onSendMessage }: MessageInputProps) => {
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (body.trim() === '' || isSending) return;
    
    setIsSending(true);
    try {
      // Call the function passed down from the parent
      await onSendMessage(body);
      setBody(''); // Clear input on success
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="relative">
        <Textarea
          placeholder="Type your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="pr-20"
          disabled={isSending}
        />
        <Button onClick={handleSend} className="absolute bottom-2 right-2" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};
