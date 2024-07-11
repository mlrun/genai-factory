export type ChatHistory = {
  name?: string
  content: string
  description?: string
  role: string
  sources: Source[]
  html?: string | undefined;
}

export type UserSession = {
  name: string
  username: string
  agent_name?: string | null
  history: ChatHistory[]
}

export type Source = {
  source: string
  title: string
}

export type TableData = {
  //eslint-disable-next-line
  name: any
  created: string
  updated: string
  tags: string
  resolved: boolean
}

export type BreadcrumbData = {
  page: string
  url: string
}

export interface DataRow<T> {
  id: number
  data: T
}

export type User = {
  name?: string
  email?: string
  role?: string
  registered?: string
  username: string
  admin: boolean
  token: string
}

