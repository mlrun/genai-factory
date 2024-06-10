import Topbar from '@components/feature/Topbar'
import Sidebar from '@components/feature/Sidebar'
import './Admin.css'
import Breadcrumbs from '@components/shared/Breadcrumbs'
import Table from '@components/feature/Table'
import Tabs from '@components/shared/Tabs'
import { useAtom } from 'jotai'
import { usernameAtom } from 'atoms'

const Admin = () => {
  const [username, setUsername] = useAtom(usernameAtom)
  const changeLogin = (data: boolean) => {
    setUsername('')
  }

  return (
    <div className="comp-admin">
      <Topbar user={username} onLoginChange={changeLogin} />
      <div className="flex">
        <Sidebar />
        <div className="content">
          <Breadcrumbs />
          <Tabs label={['First tab', 'Second one', 'Center one', 'Forth forth', 'Last tab']} selected={0} />
          <Table
            data={[
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    David
                  </a>
                ),
                created: '6 October 2016',
                updated: '6 October 2016',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drillflow.html" target="drill">
                    Michael
                  </a>
                ),
                created: '2 January 2018',
                updated: '2 January 2018',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Kate
                  </a>
                ),
                created: '28 February 2020',
                updated: '28 February 2020',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Barry
                  </a>
                ),
                created: '14 May 2020',
                updated: '14 May 2020',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Daniel
                  </a>
                ),
                created: '19 June 2023',
                updated: '19 June 2023',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Michal
                  </a>
                ),
                created: '6 October 2016',
                updated: '6 October 2016',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Karen
                  </a>
                ),
                created: '2 January 2018',
                updated: '2 January 2018',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Adi
                  </a>
                ),
                created: '28 February 2020',
                updated: '28 February 2020',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Natalie
                  </a>
                ),
                created: '14 May 2020',
                updated: '14 May 2020',
                tags: 'Complaint',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Neta
                  </a>
                ),
                created: '19 June 2023',
                updated: '19 June 2023',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Ophir
                  </a>
                ),
                created: '6 October 2016',
                updated: '6 October 2016',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Simon
                  </a>
                ),
                created: '2 January 2018',
                updated: '2 January 2018',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Lily
                  </a>
                ),
                created: '28 February 2020',
                updated: '28 February 2020',
                tags: 'Complaint',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    John
                  </a>
                ),
                created: '14 May 2020',
                updated: '14 May 2020',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Eric
                  </a>
                ),
                created: '19 June 2023',
                updated: '19 June 2023',
                tags: 'Support',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Igor
                  </a>
                ),
                created: '6 October 2016',
                updated: '6 October 2016',
                tags: 'Support',
                resolved: true
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Jack
                  </a>
                ),
                created: '2 January 2018',
                updated: '2 January 2018',
                tags: 'Complaint',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Danny
                  </a>
                ),
                created: '28 February 2020',
                updated: '28 February 2020',
                tags: 'Support',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Ken
                  </a>
                ),
                created: '14 May 2020',
                updated: '14 May 2020',
                tags: 'Complaint',
                resolved: false
              },
              {
                name: (
                  <a href="admin/drilldown.html" target="drill">
                    Rafi
                  </a>
                ),
                created: '19 June 2023',
                updated: '19 June 2023',
                tags: 'Support',
                resolved: true
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default Admin
