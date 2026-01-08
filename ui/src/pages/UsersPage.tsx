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

import { useMemo } from 'react';

import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useUserActions, useUsers } from '@queries';
import { User } from '@shared/types';
import { ColumnDef } from '@tanstack/react-table';

import { userFields } from '@constants';

const UsersPage = () => {
  const { data: users = [], error, isLoading } = useUsers();
  const { createUser, deleteUser, updateUser } = useUserActions();

  const newEntity: User = {
    name: '',
    email: '',
    full_name: '',
  };

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      { header: 'Username', accessorKey: 'name' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Full Name', accessorKey: 'full_name' },
    ],
    [],
  );

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load users.</div>;

  return (
    <EntityTable
      title="Users"
      entityName="User"
      fields={userFields}
      columns={columns}
      data={users}
      createEntity={(u) => createUser.mutate(u)}
      updateEntity={(u) => updateUser.mutate(u)}
      deleteEntity={(id) => deleteUser.mutate(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default UsersPage;
