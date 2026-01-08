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

import { useNavigate } from 'react-router-dom';

import Client from '@services/Api';
import { User } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@stores/authStore';

export function useLogin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async ({
      admin,
      password,
      username,
    }: {
      username: string;
      password: string;
      admin: boolean;
    }) => {
      // TODO: Replace with real authentication — currently uses mock data and ignores password
      storeLogin(username, password, admin);

      const res = await Client.getUser(username);
      const { data, error, success } = res;

      if (!success) {
        throw new Error(error || 'Login failed');
      }

      qc.setQueryData(['user', username], data as User);

      return { user: data as User, admin };
    },
    onSuccess: ({ admin, user }) => {
      qc.setQueryData(['user', user.username], user);
      navigate(admin ? '/projects' : '/chat');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}
