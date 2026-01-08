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

import { Link, useLocation, useParams } from 'react-router-dom';

import ProjectBreadcrumbs from '@components/feature/Project/ProjectBreadcrumbs';
import { Button } from '@components/shared/Button';

// TODO: Remove the important from the border after you remove chakra
const Navbar = () => {
  const { projectName } = useParams();
  const { pathname } = useLocation();

  const isChatPage = pathname.includes('chat');
  const isProjectsPage = pathname === '/projects';
  return (
    <div
      className="
        sticky top-0
        flex items-center justify-between
        h-[64px] bg-white z-10
        !border-b border-[rgba(72,63,86,0.12)]
      "
      data-testid="topbar"
    >
      {projectName && (
        <div className="flex items-center pl-4 gap-2">
          <ProjectBreadcrumbs />
        </div>
      )}
      {(isChatPage || isProjectsPage) && (
        <div className="pr-14 ml-auto">
          <Link to={isChatPage ? '/projects' : '/chat'}>
            <Button variant="secondary">
              {isChatPage ? 'Projects' : 'Chat'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
