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

import { useParams } from 'react-router-dom';

import Client from '@services/Api';
import { Session } from '@shared/types/session';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@stores/authStore';
import { validateApiResponse } from '@utils/validateApiResponse';

import { QUERY_DEFAULTS } from '@constants';

export function useSession() {
  const { sessionName } = useParams<{ sessionName: string }>();
  const { user } = useAuthStore();
  const username = user?.username;

  return useQuery<Session | null>({
    queryKey: ['session', username, sessionName],
    queryFn: async () => {
      if (!username || !sessionName) return null;
      return validateApiResponse(
        Client.getSession(username, sessionName),
        `fetch session ${sessionName}`,
      );
    },
    enabled: !!username && !!sessionName,
    ...QUERY_DEFAULTS,
  });
}
