/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

import React, { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import Chatbar from '@components/feature/Chat/Chatbar';
import Loading from '@components/shared/Loading';
import Navbar from '@layout/Navbar';
import { useUser } from '@queries';

import { useAuthStore } from '@stores/authStore';

const Page = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const logout = useAuthStore((s) => s.logout);

  const { data: publicUser, error, isError, isLoading } = useUser();

  const username = useMemo(() => publicUser?.name || '', [publicUser]);

  useEffect(() => {
    if (isError) {
      console.error('Failed to fetch user:', error);
      logout();
      navigate('/');
    }
  }, [isError, error, logout, navigate, username]);

  const showChatbar = pathname.includes('chat');

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col h-full">
      <Navbar />
      <div className="flex flex-1">
        {showChatbar && publicUser && (
          <div className="hidden md:flex">
            <Chatbar publicUser={publicUser} />
          </div>
        )}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Page;
