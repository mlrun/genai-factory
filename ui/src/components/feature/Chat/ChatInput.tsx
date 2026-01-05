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

import { useState } from 'react';

import { Button } from '@components/shared/Button';
import { Input } from '@components/shared/Input';
import { useSendMessage, useSession } from '@queries';

import { useChatStore } from '@stores/chatStore';

export function ChatInput() {
  const { canSend, setCanSend, setIsMessageError } = useChatStore();
  const { data: session, refetch } = useSession();

  const { mutateAsync: sendMessage } = useSendMessage();
  const [value, setValue] = useState('');

  const send = async () => {
    if (!session || !value.trim()) return;

    setCanSend(false);

    try {
      await sendMessage(
        { question: value, session_name: session.name },
        {
          onSuccess: async () => {
            setCanSend(true);
            await refetch();
          },
          onError: (error) => {
            setIsMessageError(true);
            console.error('Send message error:', error);
            setCanSend(true);
          },
        },
      );
      setValue('');
    } catch (error) {
      setIsMessageError(true);
      setCanSend(true);
      console.error(error);
    }
  };

  return (
    <div className="flex gap-2 border-t p-3 px-14">
      <Input
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
