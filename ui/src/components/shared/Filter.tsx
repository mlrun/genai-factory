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

import { CloseIcon } from '@chakra-ui/icons'
import { Flex, IconButton, Input } from '@chakra-ui/react'

type Props = {
  filterText: string
  onFilter: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

const FilterComponent = ({ filterText, onFilter, onClear }: Props) => (
  <Flex gap={2}>
    <Input
      id="search"
      type="text"
      placeholder="Filter..."
      aria-label="Search Input"
      value={filterText}
      onChange={onFilter}
    />
    <IconButton aria-label={'clear'} icon={<CloseIcon />} onClick={onClear} />
  </Flex>
)

export default FilterComponent
