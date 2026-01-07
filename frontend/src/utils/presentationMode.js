import { useEffect, useState } from 'react';

const PRESENTATION_MODE_KEY = 'aegis_presentation_mode';

const getStoredValue = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(PRESENTATION_MODE_KEY) === 'true';
};

export const setPresentationMode = (enabled) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(PRESENTATION_MODE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('presentation-mode-changed'));
};

export const usePresentationMode = () => {
  const [presentationMode, setPresentationModeState] = useState(getStoredValue());

  useEffect(() => {
    const handleChange = () => {
      setPresentationModeState(getStoredValue());
    };

    window.addEventListener('storage', handleChange);
    window.addEventListener('presentation-mode-changed', handleChange);

    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('presentation-mode-changed', handleChange);
    };
  }, []);

  return [presentationMode, setPresentationMode];
};
