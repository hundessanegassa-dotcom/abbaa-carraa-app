// frontend/hooks/useUIMode.js
import { useState, useEffect } from 'react';

export function useUIMode() {
  const [mode, setMode] = useState('classic'); // 'classic' or 'banking'

  useEffect(() => {
    const saved = localStorage.getItem('uiMode');
    if (saved === 'classic' || saved === 'banking') {
      setMode(saved);
    }
  }, []);

  const toggleMode = () => {
    const newMode = mode === 'classic' ? 'banking' : 'classic';
    setMode(newMode);
    localStorage.setItem('uiMode', newMode);
  };

  return { mode, toggleMode };
}
