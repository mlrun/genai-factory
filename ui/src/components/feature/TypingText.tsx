import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'

interface TypingTextProps {
  text: string
  speed?: number // typing speed in ms per character
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 16 }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text[index])
      ++index
      if (index === text.length - 1) {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return <Markdown>{displayedText}</Markdown>
}

export default TypingText
