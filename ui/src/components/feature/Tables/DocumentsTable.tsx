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

import { documentsAtom, documentsWithFetchAtom } from '@atoms/documents';
import { projectAtom, publicUserAtom } from '@atoms/index';
import EntityTable from '@components/shared/EntityTable';
import Client from '@services/Api';
import { Document } from '@shared/types/document';

import { documentFields } from '@constants/index';

const DocumentsTable: React.FC = () => {
  const [documents] = useAtom(documentsAtom);
  const [, fetchDocuments] = useAtom(documentsWithFetchAtom);
  const [project] = useAtom(projectAtom);
  const [publicUser] = useAtom(publicUserAtom);

  const base = project?.name ?? '';
  const uid = project?.uid ?? '';

  const newEntity: Document = {
    name: '',
    description: '',
    path: '',
    owner_id: publicUser.uid as string,
    project_id: uid,
  };

  if (Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<Document>>[] = [
    { name: 'Name', selector: (row) => row.name ?? '', sortable: true },
    {
      name: 'Description',
      selector: (row) => row.description ?? '',
      sortable: true,
    },
    { name: 'Version', selector: (row) => row.version ?? '', sortable: true },
    { name: 'Path', selector: (row) => row.path ?? '', sortable: true },
    { name: 'Origin', selector: (row) => row.origin ?? '', sortable: true },
    { name: 'Created', selector: (row) => row.created ?? '', sortable: true },
  ];

  return (
    <EntityTable
      title="Documents"
      entityName="Document"
      fields={documentFields}
      columns={columns}
      data={documents}
      fetchEntities={() => fetchDocuments(base)}
      createEntity={(d) => Client.createDocument(base, d)}
      updateEntity={(d) => Client.updateDocument(base, d)}
      deleteEntity={(id) => Client.deleteDocument(base, id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default DocumentsTable;
