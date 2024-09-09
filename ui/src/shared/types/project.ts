export type Project = {
  name: string
  uid?: string
  description?: string
  labels?: Record<string, string> | string
  owner_id: string
  version?: string
}
