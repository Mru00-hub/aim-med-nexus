import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Paperclip, X, File as FileIcon } from 'lucide-react';
import {
  postMessage,
  uploadAttachment, // Using your existing function!
} from '@/integrations/supabase/community.api';
import { useToast } from '@/components/ui/use-toast';

interface CommentInputProps {
  threadId: string;
  parentMessageId?: number | null;
  onCommentPosted: () => void;
  isReply?: boolean;
}

// Small preview component for attached files
const FilePreview = ({ file, onRemove }: { file: File; onRemove: (); }) => (
  <div className="relative flex items-center p-2 border rounded-md text-sm">
    <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
    <span className="truncate flex-1 mr-6">{file.name}</span>
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-1 right-1 h-6 w-6"
      onClick={onRemove}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
);

export const CommentInput: React.FC<CommentInputProps> = ({
  threadId,
  parentMessageId = null,
  onCommentPosted,
  isReply = false,
}) => {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]); // State for files
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && files.length === 0) return;
    if (!user) return;

    setIsLoading(true);

    try {
      // Step 1. Post the text message to get a message ID
      // We post an empty string if there's only a file
      const newMessage = await postMessage(
        threadId,
        body || '', // Post body
        parentMessageId
      );

      // Step 2. If files exist, upload them one by one
      if (files.length > 0) {
        toast({
          title: 'Uploading files...',
          description: `Attaching ${files.length} file(s) to your comment.`,
        });
        await Promise.all(
          files.map((file) => uploadAttachment(newMessage.id, file))
        );
      }

      setBody('');
      setFiles([]);
      onCommentPosted(); // This refreshes the whole comment list
      toast({
        title: 'Success',
        description: parentMessageId ? 'Reply posted.' : 'Comment posted.',
      });
    } catch (error: any) {
      console.error('Failed to post comment', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 ${isReply ? 'mt-2' : 'items-start'}`}
    >
      {!isReply && (
        <Avatar className="h-10 w-10 hidden sm:block">
          <AvatarImage
            src={profile?.profile_picture_url || ''}
            alt={profile?.full_name || 'Your avatar'}
          />
          <AvatarFallback>
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 space-y-2">
        {/* File Preview Area */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, i) => (
              <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
            ))}
          </div>
        )}

        <Textarea
          placeholder={
            parentMessageId ? 'Write a reply...' : 'Write a comment...'
          }
          rows={isReply ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <div className="flex justify-between items-center">
          {/* File Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="submit"
            size={isReply ? 'sm' : 'default'}
            disabled={isLoading || (!body.trim() && files.length === 0)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">{isReply ? 'Reply' : 'Post Comment'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
};
