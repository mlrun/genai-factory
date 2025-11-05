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

import Client from '@services/Api';
import { Session } from '@shared/types/session';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@stores/authStore';
import { validateApiResponse } from '@utils/validateApiResponse';

export function useSessionActions() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const username = user?.username;

  const invalidateSessions = async () => {
    if (username) {
      await queryClient.invalidateQueries({ queryKey: ['sessions', username] });
    }
  };

  const ensureUsername = (action: string) => {
    if (!username)
      throw new Error(`Username is required to ${action} a session.`);
  };

  const createSession = useMutation({
    mutationFn: (session: Session) => {
      ensureUsername('create');
      return validateApiResponse<Session>(
        Client.createSession(username!, session),
        `create (${session.name})`,
      );
    },
    onSuccess: invalidateSessions,
  });

  const updateSession = useMutation({
    mutationFn: (session: Session) => {
      ensureUsername('update');
      return validateApiResponse<Session>(
        Client.updateSession(username!, session),
        `update (${session.name})`,
      );
    },
    onSuccess: invalidateSessions,
  });

  const deleteSession = useMutation({
    mutationFn: (sessionName: string) => {
      ensureUsername('delete');
      return validateApiResponse<Session>(
        Client.deleteSession(username!, sessionName),
        `delete (${sessionName})`,
      );
    },
    onSuccess: invalidateSessions,
  });

  return { createSession, updateSession, deleteSession };
}
