// src/components/social/DirectMessageInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, File as FileIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { DirectMessageWithDetails } from '@/integrations/supabase/social.api';

interface DirectMessageInputProps {
  // FIX: Prop name changed for clarity, signature updated for replies and files.
  onSendMessage: (content: string, parentMessageId: number | null, files: File[]) => Promise<void>;
  replyingTo: DirectMessageWithDetails | null;
  onCancelReply: () => void;
}

export const DirectMessageInput = ({ onSendMessage, replyingTo, onCancelReply }: DirectMessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
      const urls = attachedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [attachedFiles]);

  useEffect(() => {
      if(replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const handleSend = async () => {
    if ((!body.trim() && attachedFiles.length === 0) || isSending) return;
    setIsSending(true);
    try {
      // FIX: The handler now passes the parent ID, fixing Problem #3.
      // Attachments are passed correctly, fixing Problem #4.
      const messageContent = body.trim() || (attachedFiles.length > 0 ? '' : ''); // Send empty string if only attachment
      await onSendMessage(messageContent, replyingTo?.id || null, attachedFiles);
      setBody('');
      setAttachedFiles([]);
      onCancelReply();
      setFileInputKey(Date.now());
    } catch (error) {
      console.error("Failed to send message:", error);
      // The useConversationData hook will show a toast on failure.
    } finally {
      setIsSending(false);
    }
  };
    
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    setFileInputKey(Date.now()); // Reset file input
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 pt-2 border-t bg-background">
        {replyingTo && (
            <div className="flex items-center justify-between p-2 bg-muted/70 rounded-t-lg text-sm">
                <span className="text-muted-foreground truncate">
                    Replying to: <span className="font-semibold text-foreground">{replyingTo.author?.full_name}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={onCancelReply} title="Cancel Reply"><X className="h-4 w-4" /></Button>
            </div>
        )}
        
        {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 p-2 bg-muted/50 border rounded-lg">
                {attachedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative group w-20 h-20">
                        {file.type.startsWith('image/') && previewUrls[index] ? (
                            <img src={previewUrls[index]} alt={file.name} className="w-full h-full rounded-md object-cover border" />
                        ) : (
                            <div className="w-full h-full rounded-md bg-muted flex flex-col items-center justify-center p-1 text-center"><FileIcon className="h-8 w-8 text-muted-foreground" /><p className="text-xs truncate w-full mt-1">{file.name}</p></div>
                        )}
                        <button type="button" onClick={() => handleRemoveFile(index)} className="absolute -top-1 -right-1 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full h-5 w-5 hover:bg-destructive/80 transition-colors" title={`Remove ${file.name}`}><X className="h-3 w-3" /></button>
                    </div>
                ))}
            </div>
        )}

        <div className="relative flex items-end gap-2">
            <input key={fileInputKey} type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" multiple />
            <Button variant="outline" size="icon" className="self-end" title="Attach Files" onClick={() => fileInputRef.current?.click()} type="button"><Paperclip className="h-5 w-5" /></Button>
            <Textarea ref={textareaRef} placeholder="Type your message..." value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleKeyDown} className="flex-grow resize-none max-h-40 min-h-[40px] pt-2.5" disabled={isSending} rows={1} />
            <Button onClick={handleSend} disabled={isSending || (!body.trim() && attachedFiles.length === 0)} className="self-end" size="icon">
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
