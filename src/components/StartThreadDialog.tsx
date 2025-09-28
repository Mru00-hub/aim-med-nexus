import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface StartThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onThreadCreated: (threadId: number) => void;
}

export const StartThreadDialog: React.FC<StartThreadDialogProps> = ({
  open,
  onClose,
  onThreadCreated
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || !user) return;

    setIsLoading(true);
    try {
      // Create the thread first
      const { data: threadData, error: threadError } = await supabase
        .from('threads')
        .insert({
          title: title.trim(),
          created_by: user.id
        })
        .select()
        .single();

      if (threadError || !threadData) {
        console.error('Error creating thread:', threadError);
        return;
      }

      // Then create the initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          body: message.trim(),
          sender_id: user.id,
          thread_id: threadData.id,
          is_read: false
        });

      if (messageError) {
        console.error('Error creating message:', messageError);
        return;
      }

      // Reset form and close dialog
      setTitle('');
      setMessage('');
      onClose();
      onThreadCreated(threadData.id);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start a New Thread</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter thread title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Initial Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Start the conversation..."
              rows={4}
              required
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !title.trim() || !message.trim()}
            >
              {isLoading ? 'Creating...' : 'Start Thread'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};