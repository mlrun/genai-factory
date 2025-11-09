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

import { atom } from 'jotai';

import Client from '@services/Api';
import { Session } from '@shared/types/session';

export const sessionsAtom = atom<Session[]>([]);

export const sessionsLoadingAtom = atom<boolean>(false);

export const sessionsErrorAtom = atom<string | null>(null);

export const sessionsWithFetchAtom = atom(
  (get) => get(sessionsAtom),
  async (_get, set, username) => {
    set(sessionsLoadingAtom, true);
    set(sessionsErrorAtom, null);
    try {
      const sessions = await Client.getSessions(username as string);
      const sortedSessions = sessions.data.sort((a: Session, b: Session) => {
        const dateA = new Date(a.created as string);
        const dateB = new Date(b.created as string);
        return dateA.getTime() - dateB.getTime();
      });
      set(sessionsAtom, sortedSessions);
    } catch (error) {
      console.log(`Error: ${error}`);
      set(sessionsErrorAtom, 'Failed to fetch sessions');
    } finally {
      set(sessionsLoadingAtom, false);
    }
  },
);

export const selectedSessionAtom = atom<Session>({
  name: '',
  description: '',
  labels: {},
});
