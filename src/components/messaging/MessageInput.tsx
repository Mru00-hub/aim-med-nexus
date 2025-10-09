import { useAuth } from '@/hooks/useAuth';
import React, { useState, useRef, useEffect, memo } from 'react';
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

const MessageInputComponent: React.FC<MessageInputProps> = ({ 
    threadId, 
    onSendMessage, 
    replyingTo,
    onCancelReply
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
      if (!attachedFiles.length) {
          setPreviewUrls([]);
          return;
      }
      const newUrls = attachedFiles.map(file => URL.createObjectURL(file));
      // You can remove this alert now if you wish
      if (newUrls.length > 0) {
            alert(`✅ ALERT 1 of 4: Preview URL Created\n\nURL: ${newUrls[0]}`);
      }
      setPreviewUrls(newUrls);

      return () => {
          newUrls.forEach(url => URL.revokeObjectURL(url));
      };
  }, [attachedFiles]);
  
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
  
  // --- File Attachment Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This is the alert you are seeing, which is great!
    alert("DEBUG 1: 'handleFileChange' was called.");
    
    // Now let's check what's inside the event
    if (e.target.files) {
        alert(`DEBUG 2: The 'files' object exists. It contains ${e.target.files.length} file(s).`);

        if (e.target.files.length > 0) {
            alert(`DEBUG 3: The first file is named "${e.target.files[0].name}". Now updating the component's state.`);
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            // Clearing the value allows selecting the same file again
            e.target.value = '';
        } else {
            alert("DEBUG 3b: The 'files' list was empty. Did you cancel the selection?");
        }
    } else {
        alert("DEBUG 2b: The 'files' object does NOT exist on the event target.");
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
      setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
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
                {attachedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                        <div key={index} className="relative group w-20 h-20">
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
                                onClick={() => handleRemoveFile(file)}
                                className="absolute -top-1 -right-1 bg-background rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                title={`Remove ${file.name}`}
                            >
                                <XCircle className="h-5 w-5" />
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
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="sr-only" 
                id="file-attachment-input" // <-- We've added an ID
                multiple 
            />

            {/* 2. The Button is now wrapped in a Label linked to the input's ID */}
            <label htmlFor="file-attachment-input">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="self-end"
                    title="Attach Files"
                    asChild // This prop allows the Button to act as a container for the label
                >
                    {/* The pointer-events-none is important to ensure the label receives the click */}
                    <span className="cursor-pointer pointer-events-none"> 
                        <Paperclip className="h-5 w-5" />
                    </span>
                </Button>
            </label>
    
            {/* --- END OF REPLACEMENT --- */}

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
                disabled={!profile || isSending || (body.trim() === '' && attachedFiles.length === 0)}
                className="self-end h-10 w-10 p-2"
                size="icon"
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
  );
};
export const MessageInput = memo(MessageInputComponent);
