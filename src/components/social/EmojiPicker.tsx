import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
    return (
        <div className="flex gap-1 p-1 bg-background border rounded-full shadow-lg">
            {['👍', '❤️', '🔥', '🤔', '😂'].map(emoji => (
                <span 
                    key={emoji} 
                    className="cursor-pointer hover:bg-muted rounded-full p-1 transition-colors" 
                    onClick={() => onSelect(emoji)}
                >
                    {emoji}
                </span>
            ))}
        </div>
    );
};
