/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import Bubble from '@components/shared/Bubble';
import { Card, CardContent } from '@components/shared/Card';
import { ChatHistory } from '@shared/types';

interface Props {
  messages: ChatHistory[];
  isLoading?: boolean;
  newMessageIndices?: Set<number>;
  sessionMessagesCount?: number;
}

export function ChatMessagesPanel({
  isLoading,
  messages,
  newMessageIndices = new Set(),
  sessionMessagesCount = 0,
}: Readonly<Props>) {
  const { sessionName } = useParams();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const scrollToBottom = (instant = false) => {
    if (containerRef.current && lastMessageRef.current) {
      if (instant) {
        // Direct scroll for instant updates during typing
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      } else {
        // Smooth scroll for initial loads
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  const handleTextUpdate = () => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule scroll for next frame - this ensures smooth scrolling during typing
    rafIdRef.current = requestAnimationFrame(() => {
      scrollToBottom(true); // Use instant scroll during typing to keep message visible
      rafIdRef.current = null;
    });
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-muted-foreground">
        <div className="space-y-1">
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-xs">
            Your conversation awaits… send the first message to start the magic
            ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-y-auto px-14"
    >
      <div className="space-y-3">
        {messages.map((message, index) => {
          // Only check newMessageIndices for session messages (not optimistic ones)
          // Optimistic messages are appended after session messages
          const isSessionMessage = index < sessionMessagesCount;
          const isNewMessage =
            isSessionMessage &&
            newMessageIndices.has(index) &&
            message.role === 'AI';
          return (
            <Bubble
              key={`session-${sessionName}-${index}`}
              content={message.content}
              bot={message.role}
              isNewMessage={isNewMessage}
              onTextUpdate={handleTextUpdate}
            />
          );
        })}
        {isLoading && (
          <div className="flex max-w-[800px] items-start gap-1">
            <Card className="border-0 my-2 py-1 px-4 bg-gray-200 dark:bg-gray-800 rounded-sm text-left">
              <CardContent className="p-0">
                <div className="flex items-center gap-1">
                  <span className="flex gap-0.5">
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    >
                      .
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div ref={lastMessageRef} className="h-2" />
    </div>
  );
}
