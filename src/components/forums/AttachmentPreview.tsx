import React, { useState, useEffect } from 'react';
import { Loader2, File as FileIcon, ExternalLink} from 'lucide-react';
import { SimpleAttachment } from '@/integrations/supabase/community.api';
import { supabase } from '@/integrations/supabase/client';

const PdfSpinner = () => (
  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);
const PdfError = ({ fileName }: { fileName: string }) => (
  <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center bg-muted text-destructive-foreground">
    <FileIcon className="h-10 w-10" />
    <p className="mt-2 text-xs font-medium line-clamp-2">{fileName}</p>
    <p className="text-xs text-destructive-foreground/70">Preview unavailable</p>
  </div>
);

interface AttachmentPreviewProps {
  attachment: SimpleAttachment;
}

const getPathFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/message_attachments/');
    return parts[1] ? decodeURIComponent(parts[1]) : null;
  } catch (error) {
    console.error('Error parsing attachment URL:', error);
    return null;
  }
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const isImage = attachment.file_type.startsWith('image/');
  const isVideo = attachment.file_type.startsWith('video/');
  const isPdf = attachment.file_type === 'application/pdf';

  const [pdfThumbnailUrl, setPdfThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isPdf); // Only load if it's a PDF

  // 3. Effect to generate the thumbnail URL for PDFs
  useEffect(() => {
    if (!isPdf) return;

    const path = getPathFromUrl(attachment.file_url);
    console.log('[AttachmentPreview] Path from URL:', path);
    
    if (path) {
      // Get the public URL with transformations
      const { data } = supabase.storage
        .from('message_attachments') // <-- Assumes 'attachments' bucket
        .getPublicUrl(path, {
          transform: {
            page: 0 // <-- This is the magic! 0 is the first page.
          }
        });
      console.log('[AttachmentPreview] Generated Thumbnail URL:', data.publicUrl);
      setPdfThumbnailUrl(data.publicUrl);
    } else {
      console.error('[AttachmentPreview] Could not parse path from URL:', attachment.file_url);
      setIsLoading(false);
      setPdfThumbnailUrl(null); // This will cause the PdfError to show
    }

  }, [isPdf, attachment.file_url]);

  // Handle image load/error to set loading state
  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    console.error('[AttachmentPreview] Failed to load thumbnail:', pdfThumbnailUrl);
    setIsLoading(false);
    setPdfThumbnailUrl(null); // Fallback to error icon
  };

  // Stop card navigation when clicking the preview
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const href = isPdf
    ? `https://docs.google.com/gview?url=${encodeURIComponent(attachment.file_url)}&embedded=true`
    : attachment.file_url;

  // Render images/videos as a grid item
  if (isImage) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity aspect-square"
        onClick={handleClick}
        title={attachment.file_name} 
      >
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="w-full h-full object-cover" // Fill the square
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <div 
        className="rounded-lg overflow-hidden border bg-black aspect-square"
        onClick={handleClick}
        title={attachment.file_name}
      >
        <video
          src={attachment.file_url}
          controls
          muted
          className="w-full h-full object-cover" // Fill the square
        />
      </div>
    );
  }

  // Render PDF and other files as a list-style item
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="relative group w-full overflow-hidden border rounded-lg aspect-square"
      onClick={handleClick}
      title={attachment.file_name}
    >
      {isPdf ? (
        <div className="w-full h-full overflow-hidden">
          {/* Show spinner while loading/generating */}
          {isLoading && <PdfSpinner />}
          
          {/* If we have a thumbnail, show it */}
          {pdfThumbnailUrl ? (
            <img
              src={pdfThumbnailUrl}
              alt={attachment.file_name}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              // Hide the image until it's loaded to prevent flicker
              style={{ display: isLoading ? 'none' : 'block' }}
            />
          ) : (
            // If loading is done and STILL no URL, show error
            !isLoading && <PdfError fileName={attachment.file_name} />
          )}

          {/* Badge */}
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm z-10">
            PDF
          </span>
        </div>
      ) : (
        // Fallback for other files (zip, docx, etc.)
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-2">
          <FileIcon className="h-12 w-12" />
          <p className="text-xs text-center line-clamp-2 mt-2">
            {attachment.file_name}
          </p>
        </div>
      )}

      {/* Overlay shown on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
        <ExternalLink className="h-6 w-6" />
      </div>
    </a>
  );
};
