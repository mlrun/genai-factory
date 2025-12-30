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
import { useNavigate } from 'react-router-dom';

import ProjectCard from '@components/feature/Projects/ProjectCard';
import ProjectLabels from '@components/feature/Projects/ProjectLabels';
import EntityTable from '@components/shared/EntityTable';
import Loading from '@components/shared/Loading';
import { useProjectActions, useProjects } from '@queries';
import { Project } from '@shared/types/project';
import { ColumnDef } from '@tanstack/react-table';

import { formatDate } from '@utils/formatDate';

import {
  PROJECT_ENTITY_NAME,
  PROJECT_TABLE_TITLE,
  projectFields,
} from '@constants';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { createProject, deleteProject, updateProject } = useProjectActions();

  const { data: projects, isLoading } = useProjects();

  const newEntity: Project = {
    name: '',
    owner_id: '',
    updated: '',
  };

  const columns: ColumnDef<Project>[] = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Labels',
        accessorKey: 'labels',
        cell: (row) => (
          <ProjectLabels labels={row.getValue<Project['labels']>()} />
        ),
        enableSorting: false,
      },
      {
        header: 'Last updated',
        accessorKey: 'updated',
        cell: (row) => formatDate(row.getValue<Project['updated']>()),
      },
      {
        header: 'Description',
        accessorKey: 'description',
      },
    ],
    [],
  );

  const handleOnRowClick = (project: Project) => {
    navigate(`/projects/${project.name}/monitor`);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col space-y-6 px-14 py-8">
      {projects && (
        <EntityTable
          title={PROJECT_TABLE_TITLE}
          entityName={PROJECT_ENTITY_NAME}
          fields={projectFields}
          columns={columns}
          data={projects}
          createEntity={(project) => createProject.mutateAsync(project)}
          updateEntity={(project) => updateProject.mutateAsync(project)}
          deleteEntity={(project) => deleteProject.mutate(project)}
          newEntityDefaults={newEntity}
          CardComponent={ProjectCard}
          onRowClick={handleOnRowClick}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
