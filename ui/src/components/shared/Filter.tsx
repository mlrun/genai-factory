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

import { ChangeEvent } from 'react';

import { Input } from '@components/shared/Input';

import Search from '@assets/icons/search.svg?react';

type Props = {
  filterText: string;
  onFilter: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
};

const FilterComponent = ({ filterText, onFilter, placeholder }: Props) => (
  <div className="relative max-w-60">
    <span className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center pointer-events-none">
      <Search />
    </span>
    <Input
      id="search"
      type="text"
      placeholder={placeholder}
      aria-label="Search Input"
      value={filterText}
      onChange={onFilter}
      className="pr-9 pl-4"
    />
  </div>
);

export default FilterComponent;
