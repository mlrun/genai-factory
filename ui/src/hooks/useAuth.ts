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

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import { adminAtom, usernameAtom, userWithTokenAtom } from '@atoms/index';

interface User {
  username: string;
  admin: boolean;
  token: string;
}

const useAuth = () => {
  const [user, setUser] = useAtom(userWithTokenAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const [, setAdmin] = useAtom(adminAtom);
  const navigate = useNavigate();

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
    navigate('/');
  };

  return { user, login, logout };
};

export default useAuth;
