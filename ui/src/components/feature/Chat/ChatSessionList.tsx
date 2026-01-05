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

import * as React from 'react';

import ChatSessionListItem from '@components/feature/Chat/ChatSessionListItem';
import type { Session } from '@shared/types/session';

interface Props {
  sessions: Session[];
  activeSessionName?: string;
  editingSessionId?: string | null;
  description: string;
  onSelect: (session: Session) => void;
  onStartRename: (session: Session) => void;
  onChangeDescription: (value: string) => void;
  onConfirmRename: () => void;
  onDelete: (sessionName: string) => void;
}

export function SessionsList({
  activeSessionName,
  description,
  editingSessionId,
  onChangeDescription,
  onConfirmRename,
  onDelete,
  onSelect,
  onStartRename,
  sessions,
}: Readonly<Props>) {
  if (sessions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            No sessions yet
          </p>
          <p className="text-xs text-muted-foreground">
            Start a new chat to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-2">
        {sessions.map((session) => {
          const isActive = session.name === activeSessionName;
          const isEditing = editingSessionId === session.uid;

          return (
            <ChatSessionListItem
              key={session.uid}
              isActive={isActive}
              isEditing={isEditing}
              session={session}
              description={description}
              onChangeDescription={onChangeDescription}
              onConfirmRename={onConfirmRename}
              onDelete={onDelete}
              onStartRename={onStartRename}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
