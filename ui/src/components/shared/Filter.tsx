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

import { Flex, Input } from '@chakra-ui/react';

type Props = {
  filterText: string;
  onFilter: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FilterComponent = ({ filterText, onFilter }: Props) => (
  <Flex>
    <Input
      id="search"
      type="text"
      placeholder="Search..."
      aria-label="Search Input"
      value={filterText}
      onChange={onFilter}
    />
  </Flex>
);

export default FilterComponent;
