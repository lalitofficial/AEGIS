import { useEffect, useState } from 'react';

const UI_SETTINGS_KEY = 'aegis_ui_settings';

const defaultSettings = {
  accent: 'cyan',
  showGrid: true,
  showOrbs: true,
  motion: 'normal',
  contrast: 'default',
  panelOpacity: 0.88,
  panelSoftOpacity: 0.7,
  fontScale: 1,
  glowIntensity: 0.18,
  radius: 24,
  scanlines: false,
};

const accentMap = {
  cyan: {
    accent: '#22d3ee',
    accentRgb: '34 211 238',
    accent2: '#f59e0b',
    accent2Rgb: '245 158 11',
    accent3: '#3b82f6',
    accent3Rgb: '59 130 246',
    glow: 'rgba(34, 211, 238, 0.18)',
  },
  emerald: {
    accent: '#34d399',
    accentRgb: '52 211 153',
    accent2: '#22c55e',
    accent2Rgb: '34 197 94',
    accent3: '#38bdf8',
    accent3Rgb: '56 189 248',
    glow: 'rgba(52, 211, 153, 0.18)',
  },
  amber: {
    accent: '#f59e0b',
    accentRgb: '245 158 11',
    accent2: '#fb7185',
    accent2Rgb: '251 113 133',
    accent3: '#38bdf8',
    accent3Rgb: '56 189 248',
    glow: 'rgba(245, 158, 11, 0.18)',
  },
  rose: {
    accent: '#fb7185',
    accentRgb: '251 113 133',
    accent2: '#f59e0b',
    accent2Rgb: '245 158 11',
    accent3: '#38bdf8',
    accent3Rgb: '56 189 248',
    glow: 'rgba(251, 113, 133, 0.18)',
  },
  violet: {
    accent: '#a78bfa',
    accentRgb: '167 139 250',
    accent2: '#22d3ee',
    accent2Rgb: '34 211 238',
    accent3: '#f59e0b',
    accent3Rgb: '245 158 11',
    glow: 'rgba(167, 139, 250, 0.18)',
  },
};

const readSettings = () => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  const stored = window.localStorage.getItem(UI_SETTINGS_KEY);
  if (!stored) {
    return defaultSettings;
  }
  try {
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch (error) {
    return defaultSettings;
  }
};

const applySettings = (settings) => {
  if (typeof document === 'undefined') {
    return;
  }
  const palette = accentMap[settings.accent] || accentMap.cyan;
  const root = document.documentElement;

  root.style.setProperty('--aegis-accent', palette.accent);
  root.style.setProperty('--aegis-accent-rgb', palette.accentRgb);
  root.style.setProperty('--aegis-accent-2', palette.accent2);
  root.style.setProperty('--aegis-accent-2-rgb', palette.accent2Rgb);
  root.style.setProperty('--aegis-accent-3', palette.accent3);
  root.style.setProperty('--aegis-accent-3-rgb', palette.accent3Rgb);
  root.style.setProperty('--aegis-panel-alpha', settings.panelOpacity ?? defaultSettings.panelOpacity);
  const strongAlpha = Math.min(0.98, (settings.panelOpacity ?? defaultSettings.panelOpacity) + 0.07);
  root.style.setProperty('--aegis-panel-strong-alpha', strongAlpha);
  root.style.setProperty('--aegis-panel-soft-alpha', settings.panelSoftOpacity ?? defaultSettings.panelSoftOpacity);
  root.style.setProperty('--aegis-font-scale', settings.fontScale ?? defaultSettings.fontScale);
  root.style.setProperty('--aegis-glow-intensity', settings.glowIntensity ?? defaultSettings.glowIntensity);
  root.style.setProperty('--aegis-panel-radius', `${settings.radius ?? defaultSettings.radius}px`);

  document.body.classList.toggle('aegis-grid-off', !settings.showGrid);
  document.body.classList.toggle('aegis-orbs-off', !settings.showOrbs);
  document.body.classList.toggle('aegis-motion-off', settings.motion === 'reduce');
  document.body.classList.toggle('aegis-contrast', settings.contrast === 'high');
  document.body.classList.toggle('aegis-scanlines', settings.scanlines);
};

export const setUiSettings = (next) => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  const current = readSettings();
  const updated = { ...current, ...next };
  window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(updated));
  applySettings(updated);
  window.dispatchEvent(new Event('ui-settings-changed'));
  return updated;
};

export const resetUiSettings = () => setUiSettings(defaultSettings);

export const useUiSettings = () => {
  const [settings, setSettingsState] = useState(readSettings());

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleChange = () => {
      setSettingsState(readSettings());
    };

    window.addEventListener('storage', handleChange);
    window.addEventListener('ui-settings-changed', handleChange);

    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('ui-settings-changed', handleChange);
    };
  }, []);

  const updateSettings = (next) => {
    const updated = setUiSettings(next);
    setSettingsState(updated);
  };

  const resetSettings = () => {
    const updated = resetUiSettings();
    setSettingsState(updated);
  };

  return [settings, updateSettings, resetSettings];
};
