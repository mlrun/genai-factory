# Copyright 2023 Iguazio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import uuid
from genai_factory.chains.base import ChainRunner
from genai_factory.schemas import WorkflowEvent
from a2a.client import A2ACardResolver, ClientFactory, ClientConfig
import httpx


class A2AClient(ChainRunner):
    def __init__(self, base_url: str, **kwargs):
        super().__init__(**kwargs)
        self.base_url = base_url

    async def _run(self, event: WorkflowEvent):
        # 🔹 Inject task intent HERE (correct place)
        prompt = f"""
        Please write a concise summary and a todo list based on the following Zoom conversation recording.

        Conversation:
        ---
        {event.query}
        ---
        """

        message = {
            "messageId": str(uuid.uuid4()),
            "role": "user",
            "parts": [
                {"kind": "text", "text": prompt}
            ],
        }

        # Set a generous timeout (e.g., 5 minutes) for LLM processing
        timeout = httpx.Timeout(300.0, read=300.0)
        async with httpx.AsyncClient(timeout=timeout) as http_client:
            # 1. Resolve agent card
            resolver = A2ACardResolver(
                httpx_client=http_client,
                base_url=self.base_url,
            )
            card = await resolver.get_agent_card()

            # 2. Create agent client
            factory = ClientFactory(
                ClientConfig(httpx_client=http_client)
            )
            agent_client = factory.create(card)

            text_parts = []
            # 3. Send message and collect streaming output
            async for chunk in agent_client.send_message(message):
                if not chunk:
                    continue

                # a2a-sdk yields (task, error)
                task, error = chunk

                if error:
                    raise error

                artifacts = getattr(task, "artifacts", None)
                if not artifacts:
                    continue

                for artifact in artifacts:
                    for part in artifact.parts:
                        root = part.root
                        if hasattr(root, "text") and root.text:
                            text_parts.append(root.text)
            # Join everything at the end
        return {"answer": "".join(text_parts)}