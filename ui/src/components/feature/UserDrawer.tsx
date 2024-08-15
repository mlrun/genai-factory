import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from '@chakra-ui/react'

type Props = {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedRow: any
}
const UserDrawer = ({ isOpen, onClose, selectedRow }: Props) => {
  return (
    <Drawer placement="right" size={'xl'} isOpen={isOpen} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px">{selectedRow?.data.name}</DrawerHeader>
        <DrawerBody>{JSON.stringify(selectedRow?.data, null, 2)}</DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

export default UserDrawer
