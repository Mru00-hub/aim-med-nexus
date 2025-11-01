// src/pages/community/CreatePostPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, Upload, X, File as FileIcon, Bold, Italic} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthGuard from '@/components/AuthGuard';
import { getSpaceDetails } from '@/integrations/supabase/community.api'

// Import our new API functions
import { createThread, uploadFilesForPost, AttachmentInput } from '@/integrations/supabase/community.api';
import { useCommunity } from '@/context/CommunityContext';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
const POST_BODY_MAX_LENGTH = 3000;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MAX_POST_FILES = 4; 
function getYouTubeVideoId(url: string): string | null {
  // Regex to find the video ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

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

interface LinkPreviewProps {
  data: {
    title: string;
    description: string;
    image: string;
  };
  onRemove: () => void;
}

const CreatePostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');  // This is the main "body"
  const [debouncedBody] = useDebounce(body, 500);
  const [linkPreview, setLinkPreview] = useState<{
    type: 'youtube' | 'website';
    data: any; // Will be an embedUrl for youtube, or metadata for website
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [checkedUrl, setCheckedUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { spaceId } = useParams<{ spaceId?: string }>();
  const { toast } = useToast();
  const { refreshSpaces } = useCommunity(); // To refresh the public threads list
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const urls = debouncedBody.match(URL_REGEX);
    if (files.length > 0) {
      setLinkPreview(null);
      return;
    }
    
    // Only fetch if it's a new URL
    if (urls && urls[0] && urls[0] !== checkedUrl) {
      const firstUrl = urls[0];
      setCheckedUrl(firstUrl);
      const videoId = getYouTubeVideoId(firstUrl); // Check for YouTube
      
      setIsPreviewLoading(true);
      setLinkPreview(null);
      
      // Call your Supabase function FOR ALL URLs
      supabase.functions.invoke('get-link-preview', { body: { url: firstUrl } })
        .then(({ data, error }) => {
          if (data && !error && (data.title || data.image)) {
            
            // Now, check if it's a YouTube link
            if (videoId) {
              setLinkPreview({ 
                type: 'youtube', // For the iframe
                data: { 
                  ...data, // This now has { title, description, image }
                  embedUrl: `https://www.youtube.com/embed/${videoId}` // Add the embedUrl
                } 
              });
            } else {
              // It's a regular website
              setLinkPreview({ type: 'website', data: data }); 
            }
          }
        })
        .finally(() => {
          setIsPreviewLoading(false);
        });
    }
  }, [debouncedBody, checkedUrl, files.length]);

  const applyFormat = (format: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    // Don't do anything if no text is selected
    if (selectedText.length === 0) {
      textarea.focus();
      return;
    }

    const symbols = format === 'bold' ? '**' : '*';
    const symbolLength = symbols.length;

    const textBefore = body.substring(start - symbolLength, start);
    const textAfter = body.substring(end, end + symbolLength);

    let newValue: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;

    // Check if text is already formatted (toggle off)
    if (textBefore === symbols && textAfter === symbols) {
      newValue =
        body.substring(0, start - symbolLength) +
        selectedText +
        body.substring(end + symbolLength);

      newSelectionStart = start - symbolLength;
      newSelectionEnd = end - symbolLength;
    } else {
      // Apply formatting (toggle on)
      newValue =
        body.substring(0, start) +
        symbols +
        selectedText +
        symbols +
        body.substring(end);

      newSelectionStart = start + symbolLength;
      newSelectionEnd = end + symbolLength;
    }

    // This is the key:
    // 1. Manually update the textarea's value.
    textarea.value = newValue;
    // 2. Sync React's state with the new value.
    setBody(newValue);
    // 3. Immediately focus and set the selection.
    textarea.focus();
    textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (linkPreview) {
      toast({
        variant: "destructive",
        title: "Attachments disabled",
        description: "You cannot add files when a link preview is active. Remove the preview to add files.",
      });
      return;
    }

    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // 2. Check file limit
      if (files.length + newFiles.length > MAX_POST_FILES) {
        toast({
          variant: "destructive",
          title: "File limit reached",
          description: `You can only upload a maximum of ${MAX_POST_FILES} files for a post.`,
        });
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
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
      return;
    }
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
      const newThreadId = await createThread({
          title,
          body: bodyContent, 
          attachments,
          spaceId: spaceId || null,
          preview: linkPreview 
            ? {
                title: linkPreview.data.title,
                description: linkPreview.data.description,
                image: linkPreview.data.image,
              }
            : undefined
      });
      
      toast({
        title: "Success!",
        description: "Your post has been created.",
      });

      refreshSpaces(); 
      navigate(`/community/thread/${newThreadId}`);

    } catch (err: any) {
      console.error("Failed to create post:", err);
      let errorMessage = "An unknown error occurred. Check the console.";
      if (err.message) {
        // Check for PostgREST error details
        try {
            // PostgREST errors often have a JSON string in the message
          const jsonError = JSON.parse(err.message);
          errorMessage = jsonError.message || jsonError.details || err.message;
        } catch (e) {
          // Not JSON, just use the plain message
          errorMessage = err.message;
        }
      }

      // Set the error in your component's state
      setError(errorMessage); 
  
      // Show a toast with the real error
      toast({
        variant: "destructive",
        title: "Error Creating Post",
        // Show the detailed error to yourself for debugging
        description: errorMessage, 
      });
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
        <div className="border rounded-md rounded-b-none p-1 flex items-center space-x-1 bg-muted/50">
          <Button 
            type="button" // Important! Prevents form submission
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyFormat('bold')}
            aria-label="Bold"
            title="Bold (Ctrl+B)" // Tooltip for accessibility
            disabled={isLoading}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => applyFormat('italic')}
            aria-label="Italic"
            title="Italic (Ctrl+I)" // Tooltip for accessibility
            disabled={isLoading}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>
        <Textarea 
          ref={textareaRef} // <-- Add the ref here
          id="body" 
          placeholder="Write the main content or paste a link... Select text and use the tools above to format." // <-- Updated placeholder
          rows={10} 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          disabled={isLoading} 
          maxLength={POST_BODY_MAX_LENGTH}
          className="rounded-t-none mt-0 focus-visible:ring-offset-0" // <-- Style adjustments
        />
        {isPreviewLoading && (
          <div className="flex items-center text-sm text-muted-foreground p-2">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Fetching preview...</span>
          </div>
        )}
        {linkPreview && (
          <div className="relative mt-2 border rounded-lg overflow-hidden">
            {/* Universal Remove Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-1 right-1 h-7 w-7 z-10 bg-black/30 hover:bg-black/50 text-white" 
              onClick={() => {
                setLinkPreview(null);
                setCheckedUrl(null); // Allow re-fetching
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* YouTube Player */}
            {linkPreview.type === 'youtube' && (
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={linkPreview.data.embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            
            {/* Website Preview */}
            {linkPreview.type === 'website' && (
              <>
                {linkPreview.data.image && (
                  <img 
                    src={linkPreview.data.image} 
                    alt="Preview" 
                    className="w-full h-48 object-cover" 
                  />
                )}
                <div className="p-4">
                  <h4 className="font-semibold truncate">
                    {linkPreview.data.title || 'No Title Found'}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {linkPreview.data.description || 'No Description'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="attachments" className="text-lg font-semibold">Attachments (Optional)</Label>
        {!!linkPreview && (
          <Alert variant="default" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              File attachments are disabled. Remove the link preview above to add files.
            </AlertDescription>
          </Alert>
        )}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {files.map((file, i) => (
            <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
          ))}
        </div>
        <label 
          htmlFor="file-upload" 
          className={`mt-2 flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-md ${!!linkPreview ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer hover:border-primary'}`}
        >
          <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click or drag to upload files</span>
        </label>
        <Input 
          id="file-upload" 
          type="file" 
          multiple 
          className="sr-only" 
          onChange={handleFileChange}
          disabled={isLoading || !!linkPreview}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? (uploadStatus || 'Posting...') : 'Create Post'}
        </Button>
      </div>
    </form>
  )
}

// The page component that renders the form
const CreatePostPage = () => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const [spaceName, setSpaceName] = useState('the main Community Hub');
  const [description, setDescription] = useState('This post will be visible to everyone on the Community Hub.');
  useEffect(() => {
    if (spaceId) {
      getSpaceDetails(spaceId)
        .then(details => {
          if (details) {
            setSpaceName(`'${details.name}'`);
            setDescription(`This post will be visible to all members of ${details.name}.`);
          }
        })
    }
  }, [spaceId]);
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto py-8 px-4">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {spaceId ? `New Post in ${spaceName}` : 'Create a New Public Post'}
                </CardTitle>
                <CardDescription>
                  {description}
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

