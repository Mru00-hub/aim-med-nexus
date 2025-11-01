import React from 'react';
import { Loader2, File as FileIcon } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { SimpleAttachment } from '@/integrations/supabase/community.api';

// Add the required CSS imports for react-pdf to work
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface AttachmentPreviewProps {
  attachment: SimpleAttachment;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const isImage = attachment.file_type.startsWith('image/');
  const isVideo = attachment.file_type.startsWith('video/');
  const isPdf = attachment.file_type === 'application/pdf';

  // Stop card navigation when clicking the preview
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Render images/videos as a grid item
  if (isImage) {
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity aspect-square"
        onClick={handleClick}
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
      href={attachment.file_url}
      target="_blank"
      rel="noreferrer"
      className="relative group w-full overflow-hidden flex items-center p-2 border rounded-md col-span-1"
      onClick={handleClick}
    >
      {isPdf ? (
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
          <Document
            file={attachment.file_url}
            loading={<Loader2 className="h-4 w-4 animate-spin" />}
            error={<FileIcon className="h-8 w-8 text-destructive" />}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          >
            <Page pageNumber={1} width={64} />
          </Document>
        </div>
      ) : (
        <FileIcon className="h-16 w-16 text-muted-foreground flex-shrink-0" />
      )}
      <div className="ml-3 overflow-hidden min-w-0">
        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
      </div>
    </a>
  );
};

