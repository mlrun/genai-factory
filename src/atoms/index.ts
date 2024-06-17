import { ChatHistory } from '@shared/types';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { atomWithStorage } from "jotai/utils";
export const usernameAtom = atom<string>('guest');
export const sessionIdAtom = atom<string>('');
export const adminAtom = atomWithStorage('admin', localStorage.getItem('admin') === 'true');
export const modalAtom = atom<boolean>(false);
export const asyncAtom = atom<boolean>(false);
export const messagesAtom = atom<ChatHistory[]>([]);
export const conversationsAtom = atom<ChatHistory[]>([]);

const idAtom = atom(1)

export const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return (res.json())
  },
}))
