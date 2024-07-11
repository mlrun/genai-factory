
// src/hooks/useAuth.ts
import { adminAtom, userAtom, usernameAtom } from '@atoms/index';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  admin: boolean;
  token: string;
}

const useAuth = () => {
  const [user, setUser] = useAtom(userAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const [, setAdmin] = useAtom(adminAtom);
  const navigate = useNavigate()

  useEffect(() => {
    const loginData = localStorage.getItem('user');
    if (loginData) {
      const parsedData = JSON.parse(loginData) as User;
      setUser(parsedData);
      setUsername(parsedData.username);
      setAdmin(parsedData.admin);
    }
  }, [setUser, setUsername, setAdmin]);

  const login = (username: string, password: string, admin: boolean) => {
    const token = 'dummyToken';
    const loginData = JSON.stringify({ username, admin, token });
    localStorage.setItem('user', loginData);
    setUser({ username, admin, token });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/')
  };

  return { user, login, logout };
};

export default useAuth;
