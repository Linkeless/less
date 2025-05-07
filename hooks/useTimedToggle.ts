import { useState, useCallback, useRef, useEffect } from 'react';

export function useTimedToggle(duration: number = 2000): [boolean, () => void] {
  const [isOn, setIsOn] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const trigger = useCallback(() => {
    setIsOn(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsOn(false);
    }, duration);
  }, [duration]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [isOn, trigger];
} 