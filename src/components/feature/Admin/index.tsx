import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import DataTableComponent from '@components/shared/Datatable'
import { userAtom } from 'atoms'
import { useAtom } from 'jotai'
import './Admin.css'

const Admin = () => {
  const user = useAtom(userAtom)

  return (
    <div className="flex flex-col w-full grow p-12">
      <Breadcrumbs
        crumbs={[
          {
            page: 'Home',
            url: '/'
          },
          {
            page: 'Admin',
            url: '/admin'
          }
        ]}
      />
      <Tabs>
        <TabList>
          <Tab>One</Tab>
          <Tab>Two</Tab>
          <Tab>Three</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <DataTableComponent />
          </TabPanel>
          <TabPanel>
            <p>two!</p>
          </TabPanel>
          <TabPanel>
            <p>three!</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

export default Admin
