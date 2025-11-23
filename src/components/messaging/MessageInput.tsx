import { useAuth } from '@/hooks/useAuth';
import React, { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, File as FileIcon, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
// Assuming MessageWithDetails is available via community.api
import { MessageWithDetails } from '@/integrations/supabase/community.api'; 

interface MessageInputProps {
  threadId: string;
  // The handler from ThreadView: (body, parentMessageId) => Promise<void>
  onSendMessage: (body: string, parentMessageId: number | null, files: File[]) => Promise<void>;
  replyingTo: MessageWithDetails | null;
  onCancelReply: () => void;  
}

const MessageInputComponent = forwardRef<HTMLTextAreaElement, MessageInputProps>(({ 
    threadId, 
    onSendMessage, 
    replyingTo,
    onCancelReply
}, ref) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
      if (!attachedFiles.length) {
          setPreviewUrls([]);
          return;
      }
      const newUrls = attachedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);

      return () => {
          newUrls.forEach(url => URL.revokeObjectURL(url));
      };
  }, [attachedFiles]);

  useEffect(() => {
      console.log('🔍 attachedFiles changed:', attachedFiles.length, 'files');
      attachedFiles.forEach((file, i) => console.log(`  File ${i}:`, file.name));
      // Force a re-render by updating a separate state
      setRenderTrigger(prev => prev + 1);
  }, [attachedFiles]);
  
  const handleSend = async () => {
    const trimmedBody = body.trim();
    if ((trimmedBody === '' && attachedFiles.length === 0) || isSending) return;
    
    setIsSending(true);

    try {
      // If only files (no text), send a placeholder message
      const messageBody = trimmedBody || (attachedFiles.length > 0 ? '📎 Attachment' : '');
      await onSendMessage(messageBody, replyingTo?.id || null, attachedFiles);
      
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
    // MODIFIED: Only send if Ctrl+Enter or Cmd+Enter is pressed.
    // If just 'Enter' is pressed, we do nothing, allowing the default new line behavior.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // --- File Attachment Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📎 handleFileChange triggered');
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        console.log('📎 New files:', newFiles.length);
        
        // Use functional update to ensure fresh state
        setAttachedFiles(prev => {
            const updated = [...prev, ...newFiles];
            console.log('📎 Updated attachedFiles:', updated.length);
            return updated;
        });
        
        // Force input to reset and re-render
        e.target.value = '';
        setFileInputKey(prev => prev + 1);
        
        // Force component re-render
        setTimeout(() => setRenderTrigger(prev => prev + 1), 0);
    }
  };
  
  const handleRemoveFile = (fileToRemove: File) => {
      setAttachedFiles(prev => {
          const updated = prev.filter(file => file !== fileToRemove);
          console.log('🗑️ Removed file, remaining:', updated.length);
          return updated;
      });
      setFileInputKey(prev => prev + 1);
  }
  
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
        
        {/* Reply Context Bar (Visible when replyingTo is set) */}
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
            <div className="flex flex-wrap gap-3 p-2 bg-card border rounded-lg">
                <div className="w-full text-xs text-muted-foreground mb-1">
                    Files: {attachedFiles.length}
                </div>
                {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                        <div key={`${file.name}-${file.lastModified}`} className="relative group w-20 h-20 touch-manipulation">
                            {isImage ? (
                                <img 
                                    src={previewUrls[index]} 
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(file);
                                }}
                                // These new classes create a softer look
                                className="absolute -top-1 -right-1 flex items-center justify-center bg-gray-700/70 text-white rounded-full h-5 w-5 hover:bg-red-500 transition-colors"
                                title={`Remove ${file.name}`}
                                aria-label="Remove file"
                            >
                              <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2">
            {/* 1. The input is still hidden, but now has an ID */}
            <input 
                key={fileInputKey}
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="sr-only" 
                id="file-attachment-input" // <-- We've added an ID
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
    
            {/* --- END OF REPLACEMENT --- */}

            <Textarea
                ref={ref} 
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
                disabled={!profile || isSending || (body.trim() === '' && attachedFiles.length === 0)}
                className="self-end h-10 w-10 p-2"
                size="icon"
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
})
export const MessageInput = memo(MessageInputComponent);
