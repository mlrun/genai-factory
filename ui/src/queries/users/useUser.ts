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
import { User } from '@shared/types';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@stores/authStore';
import { validateApiResponse } from '@utils/validateApiResponse';

import { QUERY_DEFAULTS } from '@constants';

export function useUser(enabled = true) {
  const user = useAuthStore((s) => s.user);
  const username = user?.username;

  return useQuery<User | null>({
    queryKey: ['user', username],
    queryFn: async () => {
      if (!username) return null;
      return validateApiResponse(
        Client.getUser(username),
        `fetch user: ${username}`,
      );
    },
    enabled: !!username && enabled,
    ...QUERY_DEFAULTS,
  });
}
