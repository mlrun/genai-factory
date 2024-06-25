import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react'
import { BreadcrumbData } from '@shared/types'

type Props = {
  crumbs: BreadcrumbData[]
}

const Breadcrumbs = ({ crumbs }: Props) => {
  return (
    <Breadcrumb>
      {crumbs.map((breadcrumb, index) => (
        <BreadcrumbItem key={index}>
          <BreadcrumbLink href={breadcrumb.url}>{breadcrumb.page}</BreadcrumbLink>
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}

export default Breadcrumbs
