// src/pages/community/CreatePostPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, Upload, X, File as FileIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthGuard from '@/components/AuthGuard';

// Import our new API functions
import { createPost, uploadFilesForPost, AttachmentInput } from '@/integrations/supabase/community.api';
import { useCommunity } from '@/context/CommunityContext';

// Helper component for file previews
const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  if (isImage) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative flex items-center p-2 border rounded-md">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="h-16 w-16 rounded-md object-cover" />
      ) : (
        <FileIcon className="h-16 w-16 text-muted-foreground" />
      )}
      <div className="ml-3 overflow-hidden">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};


const CreatePostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // This is the main "body"
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSpaces } = useCommunity(); // To refresh the public threads list

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      let attachments: AttachmentInput[] | undefined = undefined;

      // 1. Upload files first, if any
      if (files.length > 0) {
        toast({ title: "Uploading files..." });
        attachments = await uploadFilesForPost(files);
      }

      // 2. Create the post with the uploaded file info
      toast({ title: "Creating post..." });
      const newThreadId = await createPost({
          title,
          description,
          attachments,
      });
      
      toast({
        title: "Success!",
        description: "Your post has been created.",
      });

      // Refresh the main feed
      refreshSpaces(); 

      // Navigate to the new post's page
      navigate(`/community/thread/${newThreadId}`);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create post. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg font-semibold">Post Title</Label>
        <Input 
          id="title" 
          placeholder="Enter a clear and concise title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg font-semibold">Body (Optional)</Label>
        <Textarea 
          id="description" 
          placeholder="Write the main content of your post. You can add images or files below." 
          rows={10} 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          disabled={isLoading} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments" className="text-lg font-semibold">Attachments (Optional)</Label>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {files.map((file, i) => (
            <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
          ))}
        </div>
        <label htmlFor="file-upload" className="mt-2 flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
          <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click or drag to upload files</span>
        </label>
        <Input 
          id="file-upload" 
          type="file" 
          multiple 
          className="sr-only" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Posting...' : 'Create Post'}
        </Button>
      </div>
    </form>
  )
}

// The page component that renders the form
const CreatePostPage = () => {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-8 px-4">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create a New Public Post</CardTitle>
                <CardDescription>
                  This post will be visible to everyone on the Community Hub.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <CreatePostForm /> 
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </AuthGuard>
    );
};

export default CreatePostPage;

