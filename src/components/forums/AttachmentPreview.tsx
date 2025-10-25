import React from 'react';
import { SimpleAttachment } from '@/integrations/supabase/community.api';
import { FileText } from 'lucide-react';

export const AttachmentPreview = ({ attachments }: { attachments: SimpleAttachment[] | null }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mb-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att, index) => (
          <a
            key={index}
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 p-1.5 bg-muted rounded-md text-xs hover:bg-muted-foreground/20 transition-colors"
          >
            {att.file_type.startsWith('image/') ? (
              <img src={att.file_url} alt={att.file_name} className="h-4 w-4 rounded-sm object-cover" />
            ) : (
              <FileText className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="truncate max-w-[150px]">{att.file_name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
