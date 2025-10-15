import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, File as FileIcon, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ReplyContext = { id: number; content: string; sender_id: string; author_name: string; };

interface DirectMessageInputProps {
  conversationId: string;
  replyingTo: ReplyContext | null;
  onCancelReply: () => void;
  sendMessage: (body: string, files: File[]) => Promise<void>;
}

export const DirectMessageInput = ({ conversationId, replyingTo, onCancelReply, sendMessage }: DirectMessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
      const newUrls = attachedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);

      // Clean up object URLs to prevent memory leaks when the component unmounts
      // or when the attachedFiles array changes.
      return () => newUrls.forEach(url => URL.revokeObjectURL(url));
  }, [attachedFiles]);


  useEffect(() => {
      if(replyingTo) {
          textareaRef.current?.focus();
      }
  }, [replyingTo]);

  const handleSend = async () => {
    if ((!body.trim() && attachedFiles.length === 0) || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(body.trim(), attachedFiles);
      setBody('');
      setAttachedFiles([]);
      onCancelReply();
      setFileInputKey(Date.now());
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };
    
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
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
    <div className="flex flex-col gap-2 p-4 pt-2 border-t">
        {replyingTo && (
            <div className="flex items-center justify-between p-2 bg-muted/70 rounded-t-lg border-b text-sm">
                <span className="text-muted-foreground truncate">
                    Replying to: <span className="font-semibold text-foreground">{replyingTo.author_name}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={onCancelReply} title="Cancel Reply">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        
        {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 p-2 bg-muted/50 border rounded-lg">
                {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    // The previewUrls state holds the temporary URLs for images
                    const previewUrl = previewUrls[index];

                    return (
                        <div key={`${file.name}-${index}`} className="relative group w-20 h-20">
                            {isImage && previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt={file.name} 
                                    className="w-full h-full rounded-md object-cover border" 
                                />
                            ) : (
                                <div className="w-full h-full rounded-md bg-muted flex flex-col items-center justify-center p-1 text-center">
                                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground truncate w-full mt-1">{file.name}</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="absolute -top-1 -right-1 flex items-center justify-center bg-gray-700/70 text-white rounded-full h-5 w-5 hover:bg-red-500 transition-colors"
                                title={`Remove ${file.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}


        <div className="relative flex items-end gap-2">
            <input key={fileInputKey} type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" multiple />
            <Button variant="outline" size="icon" className="self-end" title="Attach Files" onClick={() => fileInputRef.current?.click()} type="button"><Paperclip className="h-5 w-5" /></Button>
            <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow resize-none max-h-40 min-h-[40px]"
                disabled={isSending}
                rows={1}
            />
            <Button onClick={handleSend} disabled={isSending || (!body.trim() && attachedFiles.length === 0)} className="self-end" size="icon">
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
