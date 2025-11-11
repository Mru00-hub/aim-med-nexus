// src/components/ui/youtube-subscribe-button.tsx

import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'youtube-platform-script';
const SCRIPT_SRC = 'https://apis.google.com/js/platform.js';

interface YouTubeSubscribeButtonProps {
  channelId: string;
}

export const YouTubeSubscribeButton: React.FC<YouTubeSubscribeButtonProps> = ({ channelId }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Function to load the script
    const loadScript = () => {
      if (document.getElementById(SCRIPT_ID)) {
        // Script already loaded, just render the button
        window.gapi?.platform?.go(buttonRef.current);
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Script loaded, now render the button
        window.gapi?.platform?.go(buttonRef.current);
      };
      
      document.body.appendChild(script);
    };

    // 2. Load the script
    loadScript();

    // 3. Clean up the script if the component unmounts (optional but good practice)
    return () => {
      const script = document.getElementById(SCRIPT_ID);
      // You might choose not to remove it if other components use it
      // if (script) {
      //   document.body.removeChild(script);
      // }
    };
  }, [channelId]); // Re-run if channelId changes, though it shouldn't in the modal

  // This is the official HTML snippet from Google, rendered via React
  return (
    <div ref={buttonRef}>
      <div
        className="g-ytsubscribe"
        data-channelid={channelId}
        data-layout="default"
        data-count="default"
      ></div>
    </div>
  );
};

// Add this line to access window.gapi without TypeScript errors
declare global {
  interface Window {
    gapi?: {
      platform: {
        go: (container?: HTMLElement | null) => void;
      };
    };
  }
}
