import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const ShortenedBody = ({ text }: { text: string | null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > 150;
  const displayText = isLong && !isExpanded ? `${text.substring(0, 150)}...` : text;

  return (
    <div className="text-sm text-muted-foreground whitespace-pre-line mb-3">
      <p>{displayText}</p>
      {isLong && (
        <Button
          variant="link"
          className="p-0 h-auto text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
};
