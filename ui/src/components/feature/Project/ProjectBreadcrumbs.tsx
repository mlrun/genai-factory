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
import { Link, useLocation } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@components/shared/Breadcrumb';
import BreadcrumbDropdown from '@components/shared/BreadcrumbDropdown';
import { DropdownMenuItem } from '@components/shared/DropdownMenu';
import { getProjectLinks } from '@layout/ProjectSidebar/projectLinks.util';
import { useProject, useProjects } from '@queries';

import { PROJECTS_BASE_PATH, SCREEN_PATH_INDEX } from '@constants';

const ProjectBreadcrumbs = () => {
  const { pathname } = useLocation();
  const { data: projects } = useProjects();
  const { data: project } = useProject();

  const links = useMemo(
    () => (project ? getProjectLinks(project.name) : []),
    [project],
  );

  const currentScreen = useMemo(
    () => pathname.split('/')[SCREEN_PATH_INDEX],
    [pathname],
  );

  const currentScreenLabel = useMemo(() => {
    return links.find(({ link }) => pathname.startsWith(link))?.label;
  }, [pathname, links]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/${PROJECTS_BASE_PATH}`}>Projects</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {projects && (
          <BreadcrumbDropdown>
            {projects.map((project) => {
              const path = currentScreen
                ? `/${PROJECTS_BASE_PATH}/${project.name}/${currentScreen}`
                : `/${PROJECTS_BASE_PATH}/${project.name}`;

              return (
                <DropdownMenuItem key={project.uid} asChild>
                  <Link to={path}>{project.name}</Link>
                </DropdownMenuItem>
              );
            })}
          </BreadcrumbDropdown>
        )}

        {project && (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${PROJECTS_BASE_PATH}/${project.name}`}>
                {project.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}

        <BreadcrumbDropdown>
          {links.map((link) => (
            <DropdownMenuItem key={link.id} asChild>
              <Link to={link.link}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
        </BreadcrumbDropdown>

        <BreadcrumbItem>
          <BreadcrumbPage>{currentScreenLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default ProjectBreadcrumbs;
