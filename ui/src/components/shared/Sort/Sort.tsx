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

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/shared/Select';
import { SortOption } from '@shared/types';

type TableSortProps<T> = {
  sortOptions: SortOption<T>[];
  sortKey: SortOption<T>['accessorKey'];
  onSortChange: (value: SortOption<T>['accessorKey']) => void;
};

const Sort = <T,>({
  onSortChange,
  sortKey,
  sortOptions,
}: TableSortProps<T>) => (
  <Select
    value={sortKey}
    onValueChange={(value) =>
      onSortChange(value as SortOption<T>['accessorKey'])
    }
  >
    <SelectTrigger className="min-w-40">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        {sortOptions.map((opt) => (
          <SelectItem key={opt.label} value={opt.accessorKey}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

export default Sort;
