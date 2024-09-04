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
import { ChatHistory, DataRow, User } from '@shared/types';
import { atom } from 'jotai';
import { atomWithStorage } from "jotai/utils";


export const sessionIdAtom = atom<string>('');
export const adminAtom = atomWithStorage('admin', localStorage.getItem('admin') === 'true');
export const modalAtom = atom<boolean>(false);
export const asyncAtom = atom<boolean>(false);
export const messagesAtom = atom<ChatHistory[]>([]);
export const conversationsAtom = atom<ChatHistory[]>([]);
export const userAtom = atomWithStorage<User | null>('user', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);
export const usernameAtom = atom<string>('');
export const selectedUserAtom = atom<User>({ username: '', admin: false, token: '' });
export const comparisonUserAtom = atom<User>({ username: '', admin: false, token: '' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectedRowAtom = atom<any>({});


export const usersAtom = atom<DataRow<User>[]>([]);
export const createUserAtom = atom(
  null,
  async (get, set, newUser: User) => {
    try {
      const createdUser = await Client.createUser(newUser);
      set(usersAtom, (prev) => [...prev, createdUser]);

    } catch (error) {
      console.error(error);
    }
  }
);
