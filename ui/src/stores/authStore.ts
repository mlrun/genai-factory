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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthUser = {
  username: string;
  admin: boolean;
  token: string;
};

type AuthState = {
  user: AuthUser | null;
  login: (username: string, password: string, admin: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      // TODO: Replace mock login with real authentication and token generation
      login: (username, _password, admin) => {
        const token = 'dummyToken';
        const newUser = { username, admin, token };
        set({ user: newUser });
      },

      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: 'auth-session',
    },
  ),
);
