import React from 'react';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  initialDelay?: number;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  textColors?: string | string[];
}

declare const TextType: React.FC<TextTypeProps>;
export default TextType;