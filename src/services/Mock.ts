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
