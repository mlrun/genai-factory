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

interface ChatMessageProps {
  message: string;
  isNewMessage?: boolean;
  onTextUpdate?: () => void;
}

const ChatMessage = ({ isNewMessage = false, message, onTextUpdate }: ChatMessageProps) => {
  // Ensure message is a valid string and remove any trailing "undefined"
  let safeMessage = typeof message === 'string' ? message : String(message || '');
  safeMessage = safeMessage.replace(/undefined$/g, '').trim();
  
  if (isNewMessage) {
    return <TypingText text={safeMessage} onTextUpdate={onTextUpdate} />;
  }
  return (
    <ReactMarkdown skipHtml components={ChakraUIRenderer()}>
      {safeMessage}
    </ReactMarkdown>
  );
};

export default ChatMessage;
