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
import Chatbar from '@components/feature/Chat/Chatbar';
import { ChatInput } from '@components/feature/Chat/ChatInput';
import { ChatMessagesPanel } from '@components/feature/Chat/ChatMessagesPanel';
import Loading from '@components/shared/Loading';
import { useSession } from '@queries';

export default function ChatPage() {
  const { data: session, error, isLoading } = useSession();

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
        <ChatMessagesPanel messages={session?.history ?? []} />
        <ChatInput />
      </div>
    </div>
  );
}
