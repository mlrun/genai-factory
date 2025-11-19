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

import { Fragment } from 'react';
import { twMerge } from 'tailwind-merge';

import { ToggleGroup, ToggleGroupItem } from '@components/shared/ToggleGroup';

import { TOGGLE_OPTIONS } from '@constants';

interface ToggleDisplayProps {
  display: 'list' | 'card';
  onDisplayChange: (display: 'list' | 'card') => void;
}

const ToggleDisplay = ({ display, onDisplayChange }: ToggleDisplayProps) => {
  return (
    <ToggleGroup
      type="single"
      className="gap-0 h-full bg-white flex items-center"
      value={display}
      onValueChange={onDisplayChange}
    >
      {TOGGLE_OPTIONS.map(({ Icon, value }, index) => (
        <Fragment key={value}>
          <ToggleGroupItem
            aria-label={value}
            value={value}
            className={twMerge(
              `
            flex min-w-[48px] p-3 justify-center items-center cursor-pointer
            first:rounded-l-md last:rounded-r-md first:border-r-0 last:border-l-0
            border text-[#7f7989]
            hover:bg-[#EBF2FF] hover:border-[#0066F3] hover:text-[#0066F3]
          `,
              value === display && 'border-[#0066F3]',
            )}
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
          {index < TOGGLE_OPTIONS.length - 1 && (
            <div className="flex w-px self-stretch bg-[#0066F3]" />
          )}
        </Fragment>
      ))}
    </ToggleGroup>
  );
};

export default ToggleDisplay;
