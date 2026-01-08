// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';

interface TypingTextProps {
  text: string;
  speed?: number; // typing speed in ms per character
  onTextUpdate?: () => void;
}

const TypingText = ({ onTextUpdate, speed = 12, text }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef<number>(0);

  useEffect(() => {
    // Reset displayed text and ensure text is valid
    if (!text || typeof text !== 'string') {
      setDisplayedText('');
      return;
    }

    // Sanitize text: remove undefined/null characters and trim any trailing "undefined" string
    const sanitizedText = text
      .split('')
      .filter((char) => char !== undefined && char !== null)
      .join('')
      .replace(/undefined$/g, '') // Remove trailing "undefined" string
      .trim();

    setDisplayedText('');
    indexRef.current = 0;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (indexRef.current < sanitizedText.length) {
        const nextChar = sanitizedText[indexRef.current];
        // Double-check that we're not adding undefined
        if (nextChar !== undefined && nextChar !== null) {
          setDisplayedText((prev) => prev + nextChar);
        }
        indexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed]);

  // Trigger scroll when displayedText updates
  useEffect(() => {
    if (displayedText && onTextUpdate) {
      onTextUpdate();
    }
  }, [displayedText, onTextUpdate]);

  if (!text) {
    return null;
  }

  // Ensure displayedText doesn't contain "undefined" before rendering
  const safeDisplayedText = displayedText.replace(/undefined$/g, '').trim();

  return <Markdown>{safeDisplayedText}</Markdown>;
};

export default TypingText;
