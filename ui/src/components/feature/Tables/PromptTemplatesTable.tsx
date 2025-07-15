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

import React from 'react'
import EntityTable from '@components/shared/EntityTable'
import { PromptTemplate } from '@shared/types/promptTemplate'
import { promptTemplatesAtom, promptTemplatesWithFetchAtom } from '@atoms/promptTemplates'
import { useAtom } from 'jotai'
import { publicUserAtom, projectAtom } from '@atoms/index'
import Client from '@services/Api'
import { TableColumn } from 'react-data-table-component'
import { promptTemplateFields } from '@constants/index'

const PromptTemplatesTable: React.FC = () => {
  const [promptTemplates] = useAtom(promptTemplatesAtom)
  const [, fetchPromptTemplates] = useAtom(promptTemplatesWithFetchAtom)
  const [project] = useAtom(projectAtom)
  const [publicUser] = useAtom(publicUserAtom)

  const base = project?.name ?? ''
  const uid = project?.uid ?? ''


  const newEntity: PromptTemplate = {
    name: '',
    description: '',
    text: '',
    arguments: ['prompt'],
    owner_id: publicUser.uid as string,
    project_id: uid
  };

  if(Object.keys(publicUser).length === 0) return;

  const columns: TableColumn<Partial<PromptTemplate>>[] = [
    { name: 'Name', selector: row => row.name ?? '', sortable: true },
    { name: 'Description', selector: row => row.description ?? '', sortable: true },
    { name: 'Version', selector: row => row.version ?? '', sortable: true },
    { name: 'Text', selector: row => row.text ?? '', sortable: false },
    { name: 'Created', selector: row => row.created ?? '', sortable: true }
  ]

  return (
    <EntityTable
      title="PromptTemplates"
      entityName="PromptTemplate"
      fields={promptTemplateFields}
      columns={columns}
      data={promptTemplates}
      fetchEntities={() => fetchPromptTemplates(base)}
      createEntity={d => Client.createPromptTemplate(base, d)}
      updateEntity={d => Client.updatePromptTemplate(base, d)}
      deleteEntity={id => Client.deletePromptTemplate(base, id)}
      newEntityDefaults={newEntity}
    />
  )
}

export default PromptTemplatesTable

