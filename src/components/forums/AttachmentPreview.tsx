import React from 'react';
import { Loader2, File as FileIcon } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { SimpleAttachment } from '@/integrations/supabase/community.api';

// Add the required CSS imports for react-pdf to work
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfSpinner = () => (
  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);
const PdfError = () => (
  <div className="flex items-center justify-center w-full h-full bg-muted text-destructive-foreground">
    <FileIcon className="h-12 w-12" />
  </div>
);

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

  const fileUrl = attachment.file_url;
  const href = isPdf
    ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
    : fileUrl;

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
      className="relative group w-full overflow-hidden border rounded-lg aspect-square"
      onClick={handleClick}
      title={attachment.file_name}
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
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <Page 
                pageNumber={1} 
                width={158} // 158px is the default size of a 'col-span-1' in a grid.
                           // This will be clipped by the parent's overflow-hidden.
              />
            </div>
            
            {/* Add a 'PDF' badge */}
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
              PDF
            </span>
          </Document>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-2">
          <FileIcon className="h-12 w-12" />
          <p className="text-xs text-center line-clamp-2 mt-2">
            {attachment.file_name}
          </p>
        </div>
      )}

      {/* Overlay shown on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
        <ExternalLink className="h-6 w-6" />
      </div>
    </a>
  );
};

