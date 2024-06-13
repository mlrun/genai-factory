import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { atomWithStorage, loadable } from "jotai/utils"
export const usernameAtom = atom<string>('');
export const sessionIdAtom = atom<string>('');
export const adminAtom = atomWithStorage('admin', false);
export const modalAtom = atom<boolean>(false);
export const asyncAtom = atom<boolean>(false);

const idAtom = atom(1)

export const userAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return (res.json())
  },
}))

export const setSessionIdAtom = atom(null, (_get, set, id: string) => {
  set(sessionIdAtom, id);
});
export const setUsernameAtom = atom(null, (_get, set, username: string) => {
  set(usernameAtom, username);
});
export const setAdminAtom = atom(null, (_get, set, admin: boolean) => {
  set(adminAtom, admin);
});
export const setModalAtom = atom(null, (_get, set, modal: boolean) => {
  set(modalAtom, modal);
});
