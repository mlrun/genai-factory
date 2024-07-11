import { ChatHistory, User } from '@shared/types';
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
