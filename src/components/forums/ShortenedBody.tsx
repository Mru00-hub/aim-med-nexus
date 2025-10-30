import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks'; // 1. Import this
import remarkGfm from 'remark-gfm';

export const ShortenedBody = ({ text }: { text: string | null }) => {
  if (!text) return null;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkBreaks, remarkGfm]}
        disallowedElements={['p']}
        unwrapDisallowed
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

