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
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import Loading from '@components/shared/Loading';
import { SidebarInset, SidebarProvider } from '@components/shared/Sidebar';
import Navbar from '@layout/Navbar';
import ProjectSidebar from '@layout/ProjectSidebar';
import { useUser } from '@queries';

import { useAuthStore } from '@stores/authStore';

const Page = () => {
  const navigate = useNavigate();
  const { projectName } = useParams();

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

  if (isLoading) return <Loading />;

  const content = (
    <>
      <Navbar />
      <div className="flex flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </>
  );

  return projectName ? (
    <SidebarProvider defaultOpen={false} className="flex flex-col h-full">
      <ProjectSidebar />
      <SidebarInset>{content}</SidebarInset>
    </SidebarProvider>
  ) : (
    <div className="flex flex-col h-full">{content}</div>
  );
};

export default Page;
