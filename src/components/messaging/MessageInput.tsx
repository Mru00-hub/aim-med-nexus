// src/components/messaging/MessageInput.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { postMessage } from '@/integrations/supabase/community/api';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  threadId: string;
}

export const MessageInput = ({ threadId }: MessageInputProps) => {
  const [body, setBody] = useState('');
  const { toast } = useToast();

  const handleSend = async () => {
    if (body.trim() === '') return;
    try {
      await postMessage(threadId, body);
      setBody(''); // Clear input on success
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error sending message', description: error.message });
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
        />
        <Button onClick={handleSend} className="absolute bottom-2 right-2">Send</Button>
      </div>
    </div>
  );
};
