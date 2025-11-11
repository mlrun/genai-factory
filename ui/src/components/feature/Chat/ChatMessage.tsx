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

import ChakraUIRenderer from 'chakra-ui-markdown-renderer';
import ReactMarkdown from 'react-markdown';

import TypingText from '../TypingText';

import { useChatStore } from '@stores/chatStore';

interface ChatMessageProps {
  message: string;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isTyping = useChatStore((state) => state.isTyping);

  if (isTyping) {
    return <TypingText text={message} />;
  }
  return (
    <ReactMarkdown skipHtml components={ChakraUIRenderer()}>
      {message}
    </ReactMarkdown>
  );
};

export default ChatMessage;
