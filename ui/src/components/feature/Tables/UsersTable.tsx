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

import { TableColumn } from 'react-data-table-component';

import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useUserActions, useUsers } from '@queries';
import { User } from '@shared/types';

import { userFields } from '@constants';

const UsersTable = () => {
  const { data: users = [], error, isLoading } = useUsers();
  const { createUser, deleteUser, updateUser } = useUserActions();

  const newEntity: User = {
    name: '',
    email: '',
    full_name: '',
  };

  const columns: TableColumn<Partial<User>>[] = [
    { name: 'Username', selector: (row) => row.name ?? '', sortable: true },
    { name: 'Email', selector: (row) => row.email ?? '', sortable: true },
    {
      name: 'Full Name',
      selector: (row) => row.full_name ?? '',
      sortable: true,
    },
  ];

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

export default UsersTable;
