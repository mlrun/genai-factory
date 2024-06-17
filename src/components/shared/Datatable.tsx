import { Box, useColorMode } from '@chakra-ui/react'
import { colors } from '@shared/theme'
import { DataRow } from '@shared/types'
import DataTable, { TableColumn, createTheme } from 'react-data-table-component'

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
type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: DataRow<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: TableColumn<DataRow<any>>[]
  title: string
  expandableRows?: boolean
}
const DataTableComponent = ({ data, columns, title, expandableRows }: Props) => {
  const { colorMode } = useColorMode()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ExpandedComponent = ({ data }: any) => <pre>{JSON.stringify(data, null, 2)}</pre>
  return (
    <Box boxShadow="md" borderRadius="md">
      <DataTable
        expandableRowsComponent={ExpandedComponent}
        expandableRows={expandableRows}
        title={title}
        theme={colorMode}
        columns={columns}
        data={data}
        pagination
      />
    </Box>
  )
}

export default DataTableComponent
