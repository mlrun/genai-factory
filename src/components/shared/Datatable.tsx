import { Box, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import DataTable, { createTheme } from 'react-data-table-component'
interface DataRow {
  id: number
  name: string
  email: string
  role: string
  registered: string
}

const data: DataRow[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', registered: '2021-01-10' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', registered: '2021-02-14' },
  { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com', role: 'User', registered: '2021-03-20' },
  { id: 4, name: 'Bob Brown', email: 'bob.brown@example.com', role: 'Moderator', registered: '2021-04-18' },
  { id: 5, name: 'Charlie Davis', email: 'charlie.davis@example.com', role: 'User', registered: '2021-05-22' },
  { id: 6, name: 'Diana Evans', email: 'diana.evans@example.com', role: 'User', registered: '2021-06-25' },
  { id: 7, name: 'Frank Green', email: 'frank.green@example.com', role: 'Admin', registered: '2021-07-30' },
  { id: 8, name: 'Grace Hill', email: 'grace.hill@example.com', role: 'User', registered: '2021-08-11' },
  { id: 9, name: 'Henry Irving', email: 'henry.irving@example.com', role: 'User', registered: '2021-09-15' },
  { id: 10, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' },
  { id: 11, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' },
  { id: 12, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' },
  { id: 13, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' },
  { id: 14, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' },
  { id: 15, name: 'Isabel Jackson', email: 'isabel.jackson@example.com', role: 'Moderator', registered: '2021-10-19' }
]

const columns = [
  {
    name: 'Name',
    selector: (row: DataRow) => row.name,
    sortable: true
  },
  {
    name: 'Email',
    selector: (row: DataRow) => row.email,
    sortable: true
  },
  {
    name: 'Role',
    selector: (row: DataRow) => row.role,
    sortable: true
  },
  {
    name: 'Registered',
    selector: (row: DataRow) => row.registered,
    sortable: true
  }
]

createTheme(
  'dark',
  {
    text: {
      primary: colors.gray100,
      secondary: colors.info
    },
    background: {
      default: colors.gray900
    },

    divider: {
      default: colors.gray800
    },
    action: {
      button: 'rgba(0,0,0,.54)',
      hover: 'rgba(0,0,0,.08)',
      disabled: 'rgba(0,0,0,.12)'
    }
  },
  'light'
)

const DataTableComponent: React.FC = () => {
  const { colorMode } = useColorMode()
  return (
    <Box boxShadow="md" borderRadius="md">
      <DataTable title="Users" theme={colorMode} columns={columns} data={data} pagination />
    </Box>
  )
}

export default DataTableComponent
