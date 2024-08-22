// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
  uid?: string
  name?: string
  email?: string
  role?: string
  registered?: string
  username?: string
  admin?: boolean
  token?: string
  full_name?: string;
}

