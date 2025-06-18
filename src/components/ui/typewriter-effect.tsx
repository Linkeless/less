'use client'

import { useState, useEffect } from 'react'

interface TypewriterEffectProps {
  text: string
  speed?: number
  className?: string
  showCursor?: boolean
  cursorClassName?: string
}

export default function TypewriterEffect({
  text,
  speed = 150,
  className = '',
  showCursor = true,
  cursorClassName = ''
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursorBlink, setShowCursorBlink] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  useEffect(() => {
    if (currentIndex >= text.length) {
      // 打字完成后，开始光标闪烁
      const cursorInterval = setInterval(() => {
        setShowCursorBlink(prev => !prev)
      }, 530)

      return () => clearInterval(cursorInterval)
    }
  }, [currentIndex, text.length])

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span 
          className={`inline-block ml-1 ${cursorClassName} ${
            currentIndex < text.length || showCursorBlink ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-100`}
        >
          |
        </span>
      )}
    </span>
  )
} 