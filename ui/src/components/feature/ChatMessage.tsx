import React from 'react'
import TypingText from './TypingText'

interface ChatMessageProps {
  message: string
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return <TypingText text={message} />
}

export default ChatMessage
