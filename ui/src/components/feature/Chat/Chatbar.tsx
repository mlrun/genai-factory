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

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@components/shared/Button';
import { useSession, useSessionActions, useSessions, useUser } from '@queries';
import { Session } from '@shared/types/session';

import { SessionsList } from './ChatSessionList';

import { generateSessionId } from '@shared/utils';
import { useChatStore } from '@stores/chatStore';

import { DEFAULT_WORKFLOW_UID } from '@constants';

export default function Chatbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { setCanSend, setIsTyping } = useChatStore();

  const { data: sessions = [] } = useSessions();
  const { data: selectedSession } = useSession();
  const { data: publicUser } = useUser();

  const { createSession, deleteSession, updateSession } = useSessionActions();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const activeSessionName = pathname.split('/chat/')[1];

  useEffect(() => {
    if (pathname !== '/chat') return;
    if (!sessions.length) return;
    if (selectedSession) return;

    const firstSession = sessions[0];

    setIsTyping(false);
    setCanSend(true);
    navigate(`/chat/${firstSession.name}`, { replace: true });
  }, [pathname, sessions, selectedSession, navigate, setCanSend, setIsTyping]);

  const handleSelect = (session: Session) => {
    setIsTyping(false);
    setCanSend(true);
    navigate(`/chat/${session.name}`);
  };

  const handleNewChat = useCallback(async () => {
    const payload = {
      name: generateSessionId(),
      description: '* New Chat',
      labels: {},
      workflow_id: DEFAULT_WORKFLOW_UID,
      owner_id: publicUser?.uid,
    };

    const newSession = await createSession.mutateAsync(payload);

    // Explicitly navigate to the new session
    navigate(`/chat/${newSession.name}`);
  }, [createSession, navigate, publicUser]);

  const handleRename = () => {
    if (!selectedSession) return;

    updateSession.mutate({
      ...selectedSession,
      description,
    });

    setEditingSessionId(null);
  };

  return (
    <div className="flex h-full w-72 flex-col border-r">
      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="w-full rounded-md border cursor-pointer bg-[#171717] text-white hover:bg-[#171717]/90"
        >
          + New chat
        </Button>
      </div>

      <SessionsList
        sessions={sessions}
        activeSessionName={activeSessionName}
        editingSessionId={editingSessionId}
        description={description}
        onSelect={handleSelect}
        onStartRename={(session: Session) => {
          setEditingSessionId(session.uid ?? null);
          setDescription(session.description);
        }}
        onChangeDescription={setDescription}
        onConfirmRename={handleRename}
        onDelete={(name: string) => deleteSession.mutate(name)}
      />
    </div>
  );
}
