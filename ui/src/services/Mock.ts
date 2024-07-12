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

import Data from '@assets/data.json';
import { UserSession } from '@shared/types';

class MockClient {

  async listSessions(username?: string, mode?: string, last?: number) {
    if (mode === 'names') {
      return ["5c3c04ce538d461d91931112e14c0a37"]
    }
    return [{ name: "5c3c04ce538d461d91931112e14c0a37", description: "Session 1" },
    { name: "30a933a24ded4d2eb893570f2ada2bd1", description: "Session 2" }];
  }

  async getSession(id?: string, username?: string): Promise<UserSession> {
    if (id) {
      return {
        "name": "5c3c04ce538d461d91931112e14c0a37",
        "username": "yhaviv@gmail.com",
        "agent_name": 'agent',
        "history": [{ role: "AI", name: 'Conversation', content: "Hi, How can I help you today?", description: 'info', sources: [] }]
      };
    }
    return Data;
  }

  async submitQuery(id: string, question: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ answer: "  I don't know what to say to that, I'm sorry. Is there anything else I can help you with?", sources: null, state: {} });
      }, 2000);
    });
  }
}

export default MockClient;
