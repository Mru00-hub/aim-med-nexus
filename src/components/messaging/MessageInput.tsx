// src/components/messaging/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
// Assuming MessageWithDetails is available via community.api
import { MessageWithDetails } from '@/integrations/supabase/community.api'; 

// --- PLACEHOLDER API CALL FOR ATTACHMENTS (Must be implemented) ---
// This placeholder simulates the attachment upload and DB insert process
const attachFileToMessagePlaceholder = async (file: File) => {
    return new Promise<{ fileName: string }>(resolve => {
        console.log(`[Attachment] Initiating upload for: ${file.name}`);
        setTimeout(() => {
            resolve({ fileName: file.name });
        }, 1000); // Simulate network delay
    });
};
// --- END PLACEHOLDER ---

interface MessageInputProps {
  threadId: string;
  // The handler from ThreadView, now accepting parentMessageId (null for new message)
  onSendMessage: (body: string, parentMessageId: number | null) => Promise<void>;
  
  // NEW PROPS for Reply Functionality (State managed in ThreadView)
  replyingTo: MessageWithDetails | null;
  onCancelReply: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
    threadId, 
    onSendMessage, 
    replyingTo,
    onCancelReply 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const handleSend = async () => {
    const trimmedBody = body.trim();

    if (trimmedBody === '' && attachedFiles.length === 0 || isSending) return;
    
    setIsSending(true);

    try {
      // 1. Determine the parent message ID (if replying)
      const parentMessageId = replyingTo?.id || null;

      // 2. Send the message (Text/Body)
      await onSendMessage(trimmedBody, parentMessageId);
      
      // 3. Clear UI state on success
      setBody(''); 
      setAttachedFiles([]);
      onCancelReply();
      
      // NOTE ON ATTACHMENTS: 
      // For full robustness, attachments should be uploaded *after* // the message is created and the messageId is known, or via a queue 
      // system. For this implementation, we assume text and attachments 
      // are handled sequentially or by a more complex RPC. We clear the 
      // UI state here and rely on the full architecture handling the files 
      // after the message is confirmed.

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error sending message', description: error.message });
      // Keep input content on failure
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
  
  // --- File Attachment Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          // In a real app, you would enforce a limit on files here
          setAttachedFiles(Array.from(e.target.files));
          // Reset input to allow selecting the same file again if needed
          e.target.value = ''; 
      }
  };

  const handleRemoveFile = (fileToRemove: File) => {
      setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  }

  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
        
        {/* Reply Context Bar */}
        {replyingTo && (
            <div className="flex items-center justify-between p-2 bg-muted/70 rounded-t-lg border-b text-sm">
                <span className="text-muted-foreground">
                    Replying to: <span className="font-semibold text-foreground">{replyingTo.author?.full_name || 'Message'}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={onCancelReply} title="Cancel Reply">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        
        {/* Attachments Preview */}
        {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-card border rounded-lg">
                <p className="text-xs font-medium w-full">Attachments:</p>
                {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2 py-0.5">
                        <Paperclip className="h-3 w-3" />
                        {file.name}
                        <X className="h-3 w-3 cursor-pointer text-red-500 hover:text-red-700 ml-1" onClick={() => handleRemoveFile(file)} />
                    </div>
                ))}
            </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2">
            
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
            />

            {/* Attachment Button */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="self-end"
                title="Attach Files"
            >
                <Paperclip className="h-5 w-5" />
            </Button>
            
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
                disabled={isSending || (body.trim() === '' && attachedFiles.length === 0)}
                className="self-end h-10 w-10 p-2"
                size="icon"
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
