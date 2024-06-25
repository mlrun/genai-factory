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
