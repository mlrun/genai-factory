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
import { useProjectEntity, useUser } from '@queries';
import Client from '@services/Api';
import { Model, ModelType } from '@shared/types/model';
import { ColumnDef } from '@tanstack/react-table';

import { modelFields } from '@constants';

const ModelsTable = () => {
  const { data: publicUser } = useUser();

  const {
    create,
    data: models = [],
    error,
    isLoading,
    project,
    remove,
    update,
  } = useProjectEntity<Model>(
    'models',
    (projectName) => Client.getModels(projectName),
    (projectName, model) => Client.createModel(projectName, model),
    (projectName, model) => Client.updateModel(projectName, model),
    (projectName, id) => Client.deleteModel(projectName, id),
  );

  const projectUid = project?.uid ?? '';

  const newEntity: Model = useMemo(
    () => ({
      name: '',
      description: '',
      base_model: '',
      model_type: ModelType.MODEL,
      owner_id: publicUser?.uid ?? '',
      project_id: projectUid,
      path: '',
      task: '',
      producer: '',
      deployment: '',
    }),
    [publicUser?.uid, projectUid],
  );

  const columns: ColumnDef<Model>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Description', accessorKey: 'description', enableSorting: true },
    { header: 'Version', accessorKey: 'version' },
    { header: 'Base Model', accessorKey: 'base_model', enableSorting: true },
    { header: 'Model Type', accessorKey: 'model_type', enableSorting: true },
    { header: 'Task', accessorKey: 'task' },
    { header: 'Path', accessorKey: 'path' },
    { header: 'Producer', accessorKey: 'producer' },
    { header: 'Deployment', accessorKey: 'deployment', enableSorting: true },
    { header: 'Created', accessorKey: 'created' },
  ];

  if (isLoading) return <Loading />;
  if (error) return <div>Failed to load models.</div>;

  return (
    <EntityTable
      title="Models"
      entityName="Model"
      fields={modelFields}
      columns={columns}
      data={models}
      createEntity={(d) => create.mutate(d)}
      updateEntity={(d) => update.mutate(d)}
      deleteEntity={(id) => remove.mutate(id)}
      newEntityDefaults={newEntity}
    />
  );
};

export default ModelsTable;
