import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, File as FileIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { socialApi } from '@/integrations/supabase/social.api';
import { useAuth } from '@/hooks/useAuth';

interface DirectMessageInputProps {
  conversationId: string;
}

export const DirectMessageInput = ({ conversationId }: DirectMessageInputProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Used to reset the file input

  useEffect(() => {
    // Create preview URLs for attached files
    const newUrls = attachedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newUrls);

    // Cleanup function to revoke URLs and prevent memory leaks
    return () => newUrls.forEach(url => URL.revokeObjectURL(url));
  }, [attachedFiles]);

  const handleSend = async () => {
    if ((!body.trim() && attachedFiles.length === 0) || isSending || !user) return;
    
    setIsSending(true);

    try {
      // 1. Upload attachments first
      const uploadPromises = attachedFiles.map(file => socialApi.messaging.uploadAttachment(file, conversationId));
      const uploadResults = await Promise.all(uploadPromises);
      
      const attachmentUrls: string[] = [];
      let uploadFailed = false;
      
      uploadResults.forEach(res => {
        if (res.data?.publicUrl) {
          attachmentUrls.push(res.data.publicUrl);
        } else {
          uploadFailed = true;
        }
      });
      
      if (uploadFailed) {
        toast({ title: "Some attachments failed to upload.", variant: "destructive" });
      }

      // 2. Construct the final message body
      let finalBody = body.trim();
      if (attachmentUrls.length > 0) {
        const attachmentLinks = attachmentUrls.map(url => `\n📎 Attachment: ${url}`).join('');
        finalBody += attachmentLinks;
      }
      
      // 3. Send the message
      if(finalBody){
        await socialApi.messaging.sendMessage({
          conversation_id: conversationId,
          sender_id: user.id,
          content: finalBody,
        });
      }
      
      // 4. Reset state
      setBody('');
      setAttachedFiles([]);
      setFileInputKey(Date.now()); // Reset file input

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Your message could not be sent.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
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
        {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 p-2 bg-muted/50 border rounded-lg">
                {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                        <div key={`${file.name}-${index}`} className="relative group w-20 h-20">
                            {isImage ? (
                                <img src={previewUrls[index]} alt={file.name} className="w-full h-full rounded-md object-cover border" />
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
            <input 
                key={fileInputKey}
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="sr-only" 
                multiple 
            />
            <Button 
                variant="outline" 
                size="icon" 
                className="self-end"
                title="Attach Files"
                onClick={() => fileInputRef.current?.click()}
                type="button"
            >
                <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
                placeholder="Type your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow resize-none max-h-40 min-h-[40px]"
                disabled={isSending}
                rows={1}
            />
            <Button 
                onClick={handleSend} 
                disabled={isSending || (!body.trim() && attachedFiles.length === 0)}
                className="self-end"
                size="icon"
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
