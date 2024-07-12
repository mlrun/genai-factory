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

import axios, { AxiosResponse } from 'axios'
import MockClient from './Mock'

const debugMode = false // Set this to true if you are in debug mode

class ApiClient {
  private client

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: false
    })
  }

  private handleResponse(response: AxiosResponse) {
    if (response.data.success) {
      return response.data.data
    } else {
      console.error(response.data.error)
      return null
    }
  }

  private handleError(error: Error) {
    console.error(error.message)
    return null
  }

  async listSessions(username?: string, mode?: string, last?: number) {
    try {
      const response = await this.client.get('/sessions', {
        params: { last: last, username: username, mode: mode || 'short' }
      })
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error as Error)
    }
  }

  async getSession(id?: string, username?: string) {
    try {
      const response = await this.client.get(`/session/${id || '$last'}`, {
        headers: { 'x-username': username || 'guest' }
      })
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error as Error)
    }
  }

  async submitQuery(id: string, question: string, username?: string) {
    try {
      const response = await this.client.post(
        '/pipeline/default/run',
        { session_id: id, question: question },
        {
          headers: { 'x-username': username || 'guest' }
        }
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error as Error)
    }
  }
}

function getClient() {
  if (debugMode) {
    return new MockClient()
  } else {
    return new ApiClient() // Return the real client here
  }
}

const Client = getClient()

export default Client
