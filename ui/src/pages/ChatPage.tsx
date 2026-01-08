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

import { useState, useMemo, useEffect, useRef } from 'react';

import Chatbar from '@components/feature/Chat/Chatbar';
import { ChatInput } from '@components/feature/Chat/ChatInput';
import { ChatMessagesPanel } from '@components/feature/Chat/ChatMessagesPanel';
import Loading from '@components/shared/Loading';
import { useSession } from '@queries';
import { ChatHistory } from '@shared/types';

export default function ChatPage() {
  const { data: session, error, isLoading } = useSession();
  const [optimisticMessages, setOptimisticMessages] = useState<ChatHistory[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [newMessageIndices, setNewMessageIndices] = useState<Set<number>>(new Set());
  const lastHistoryLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const wasWaitingForResponseRef = useRef(false);

  const handleMessageSent = (message: string) => {
    const optimisticMessage: ChatHistory = {
      content: message,
      role: 'user',
      sources: [],
    };
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoadingResponse(loading);
    // Track when we start waiting for a response
    if (loading) {
      wasWaitingForResponseRef.current = true;
    }
  };

  // Initialize lastHistoryLength on first load
  useEffect(() => {
    if (session?.history && isInitialLoadRef.current) {
      lastHistoryLengthRef.current = session.history.length;
      isInitialLoadRef.current = false;
    }
  }, [session?.history]);

  // Track new messages when session history updates (after refetch)
  useEffect(() => {
    const currentHistoryLength = session?.history?.length ?? 0;
    
    // Skip on initial load - never mark initial messages as new
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear optimistic messages whenever session history updates (response received)
    // This ensures the user's message from session history replaces the optimistic one
    if (currentHistoryLength > lastHistoryLengthRef.current) {
      setOptimisticMessages([]);
      
      // Mark AI messages as new for typing animation when response is received
      // Only do this if we were waiting for a response (to avoid marking on refresh)
      if (wasWaitingForResponseRef.current) {
        // New messages arrived while waiting for response - mark AI messages as new for typing animation
        const newIndices = new Set<number>();
        const sessionHistory = session?.history ?? [];
        
        for (let i = lastHistoryLengthRef.current; i < currentHistoryLength; i++) {
          // Only mark AI messages for typing animation
          if (sessionHistory[i]?.role === 'AI') {
            newIndices.add(i);
          }
        }
        
        if (newIndices.size > 0) {
          setNewMessageIndices(newIndices);
          
          // Clear new message indices after typing animation completes (give it time)
          setTimeout(() => {
            setNewMessageIndices(new Set());
          }, 10000); // Clear after 10 seconds (enough time for typing animation)
        }
        
        // Reset the flag AFTER processing new messages
        wasWaitingForResponseRef.current = false;
      }
    }
    
    lastHistoryLengthRef.current = currentHistoryLength;
  }, [session?.history]);

  // Combine session messages with optimistic messages
  const allMessages = useMemo(() => {
    const sessionMessages = session?.history ?? [];
    return [...sessionMessages, ...optimisticMessages];
  }, [session?.history, optimisticMessages]);

  if (isLoading) return <Loading />;
  if (error)
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Failed to load chat.
      </div>
    );

  return (
    <div className="flex h-full w-full">
      <Chatbar />
      <div className="flex flex-1 flex-col justify-between h-full">
        <ChatMessagesPanel 
          messages={allMessages} 
          isLoading={isLoadingResponse}
          newMessageIndices={newMessageIndices}
          sessionMessagesCount={session?.history?.length ?? 0}
        />
        <ChatInput 
          onMessageSent={handleMessageSent} 
          onLoadingChange={handleLoadingChange}
          isLoadingResponse={isLoadingResponse}
        />
      </div>
    </div>
  );
}
