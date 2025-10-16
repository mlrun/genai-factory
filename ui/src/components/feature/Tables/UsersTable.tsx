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

import React from 'react';
import { useAtom } from 'jotai';
import { TableColumn } from 'react-data-table-component';

import { publicUserAtom } from '@atoms/index';
import { usersAtom, usersWithFetchAtom } from '@atoms/users';
import EntityTable from '@components/shared/EntityTable';
import Client from '@services/Api';
import { User } from '@shared/types';

import { userFields } from '@constants/index';

const UsersTable: React.FC = () => {
  const [users] = useAtom(usersAtom);
  const [, fetchUsers] = useAtom(usersWithFetchAtom);
  const [publicUser] = useAtom(publicUserAtom);

  const newEntity: User = {
    name: '',
    email: '',
    full_name: '',
  };

  if (Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<User>>[] = [
    { name: 'Username', selector: (row) => row.name ?? '', sortable: true },
    { name: 'Email', selector: (row) => row.email ?? '', sortable: true },
    {
      name: 'Full Name',
      selector: (row) => row.full_name ?? '',
      sortable: true,
    },
  ];

  return (
    <EntityTable
      title="Users"
      entityName="Users"
      fields={userFields}
      columns={columns}
      data={users}
      fetchEntities={() => fetchUsers()}
      createEntity={(d) => Client.createUser(d)}
      updateEntity={(d) => Client.updateUser(d)}
      deleteEntity={(id) => Client.deleteUser(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default UsersTable;
