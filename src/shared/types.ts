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
