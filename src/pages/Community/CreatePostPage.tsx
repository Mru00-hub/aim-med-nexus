// src/pages/community/CreatePostPage.tsx

import React, { useState, useEffect } from 'react';
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
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
const POST_BODY_MAX_LENGTH = 3000;
// Helper component for file previews
const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPdf = file.type === 'application/pdf';
  // --- THIS IS THE FIX ---
  // We must use useEffect to run the file reader only once when the file changes.
  useEffect(() => {
    let objectUrl: string | null = null;
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      } else if (isVideo) {
      objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else if (isPdf) {
      // For PDFs, we don't set a preview URL.
      // We will pass the 'file' object directly to the Document component.
      setPreview(null); // Ensure preview is null
    } else {
      setPreview(null);
    }

    // Cleanup for video URLs
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file, isImage, isVideo, isPdf]);

  return (
    <div className="relative group w-full overflow-hidden flex items-center p-2 border rounded-md">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="h-16 w-16 rounded-md object-cover flex-shrink-0" />
      ) : isVideo && preview ? (
        // Video preview
        <video 
          src={preview} 
          muted 
          className="h-16 w-16 rounded-md object-cover flex-shrink-0" 
        />
      ) : isPdf ? (
        // --- PDF PREVIEW BLOCK ---
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
          <Document
            file={file}
            // Show a simple loading message
            loading={<Loader2 className="h-4 w-4 animate-spin" />}
            // Show an error message
            error={<FileIcon className="h-8 w-8 text-destructive" />}
            // Hide annotation/text layers for a clean preview
            renderAnnotationLayer={false}
            renderTextLayer={false}
          >
            {/* We must scale the page down to fit our tiny box */}
            {/* The default PDF page is ~595px wide. 64/595 = ~0.107 */}
            <Page pageNumber={1} width={64} />
          </Document>
        </div>
      ) : (
        // Fallback icon
        <FileIcon className="h-16 w-16 text-muted-foreground flex-shrink-0" />
      )}
      <div className="ml-3 overflow-hidden min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

const CreatePostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');  // This is the main "body"
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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
      setError('A title is required.');
      return;
    }
    const bodyContent = body.trim();
    if (!bodyContent && files.length === 0) {
      setError('You must include a message body or at least one attachment.');
    setIsLoading(true);
    setError('');

    try {
      let attachments: AttachmentInput[] | undefined = undefined;

      // --- 2. UPDATE HANDLESUBMIT ---
      if (files.length > 0) {
        setUploadStatus('Uploading files...'); // <-- Set status
        toast({ title: "Uploading files..." });
        attachments = await uploadFilesForPost(files);
      }

      setUploadStatus('Creating post...'); // <-- Set status
      toast({ title: "Creating post..." });
      const newThreadId = await createPost({
          title,
          body: bodyContent, 
          attachments,
      });
      
      toast({
        title: "Success!",
        description: "Your post has been created.",
      });

      refreshSpaces(); 
      navigate(`/community/thread/${newThreadId}`);

    } catch (err: any) {
      // ... (error handling)
    } finally {
      setIsLoading(false);
      setUploadStatus(null); // <-- Clear status on end
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
        <Label htmlFor="body" className="text-lg font-semibold">Body (Optional)</Label>
        <Textarea 
          id="body" 
          placeholder="Write the main content of your post. You can add images or files below." 
          rows={10} 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          disabled={isLoading} 
          maxLength={POST_BODY_MAX_LENGTH} 
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

