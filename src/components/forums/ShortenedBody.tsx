import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks'; // 1. Import this

// 2. Remove useState and Button imports

// 3. Replace the component
export const ShortenedBody = ({ text }: { text: string | null }) => {
  if (!text) return null;

  // 4. Remove all logic for isExpanded, isLong, and displayText.
  //    We will render the full Markdown text.

  return (
    // 5. Use 'prose' for Markdown styling.
    //    The line clamping is now handled by the parent component.
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
        {text}
      </ReactMarkdown>
    </div>
  );
};

