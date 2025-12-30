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

import { ReactNode } from 'react';

import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from '@components/shared/Breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@components/shared/DropdownMenu';

import { cn } from '@shared/cn/utils';

type Props = {
  children: ReactNode;
};

const BreadcrumbDropdown = ({ children }: Props) => {
  return (
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-1 rounded-full p-2 cursor-pointer outline-none',
            'hover:bg-gray-200',
            'data-[state=open]:bg-gray-200',
            '[&>li>svg]:transition-transform [&>li>svg]:duration-200 data-[state=open]:[&>li>svg]:rotate-90',
          )}
        >
          <BreadcrumbSeparator />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="rounded-sm">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
};

export default BreadcrumbDropdown;
