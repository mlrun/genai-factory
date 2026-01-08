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

import { useEffect, useRef, useState } from 'react';

import { Button } from '@components/shared/Button';
import { Input } from '@components/shared/Input';
import { useSendMessage, useSession } from '@queries';

import { useChatStore } from '@stores/chatStore';

interface ChatInputProps {
  onMessageSent?: (message: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  isLoadingResponse?: boolean;
}

export function ChatInput({
  isLoadingResponse,
  onLoadingChange,
  onMessageSent,
}: Readonly<ChatInputProps>) {
  const { canSend, setCanSend, setIsMessageError } = useChatStore();
  const { data: session, refetch } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLoadingRef = useRef(false);

  const { mutateAsync: sendMessage } = useSendMessage();
  const [value, setValue] = useState('');

  // Keep input focused on mount and when it becomes enabled
  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Focus input when loading completes (response received)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoadingResponse && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure DOM is ready
    }
    prevLoadingRef.current = isLoadingResponse ?? false;
  }, [isLoadingResponse]);

  const send = async () => {
    if (!session || !value.trim()) return;

    setCanSend(false);
    const messageToSend = value.trim();

    // Clear input immediately
    setValue('');

    // Focus input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    // Add message optimistically to the panel
    onMessageSent?.(messageToSend);

    // Show loading state
    onLoadingChange?.(true);

    try {
      await sendMessage(
        { question: messageToSend, session_name: session.name },
        {
          onSuccess: async () => {
            setCanSend(true);
            await refetch();
            onLoadingChange?.(false);
            // Re-focus input after response is received
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          },
          onError: (error) => {
            setIsMessageError(true);
            console.error('Send message error:', error);
            setCanSend(true);
            onLoadingChange?.(false);
            // Re-focus input on error
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          },
        },
      );
    } catch (error) {
      setIsMessageError(true);
      setCanSend(true);
      onLoadingChange?.(false);
      console.error(error);
    }
  };

  return (
    <div className="flex gap-2 border-t p-3 px-14">
      <Input
        ref={inputRef}
        id="messageInput"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Send agent message…"
        onKeyDown={(e) => e.key === 'Enter' && send()}
        disabled={!canSend}
      />
      <Button
        className="h-full cursor-pointer bg-[#171717] text-white hover:bg-[#171717]/90"
        onClick={send}
        disabled={!canSend}
      >
        Send
      </Button>
    </div>
  );
}
