import { create } from 'zustand';

export type ShortcutEntry = { key: string; moduleId: string };

type SettingsState = {
  darkMode: boolean;
  quietMode: boolean;
  theme: 'brutal' | 'quiet' | 'google';
  shortcuts: ShortcutEntry[];
  isSettingsOpen: boolean;

  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
  toggleQuietMode: () => void;
  setTheme: (theme: 'brutal' | 'quiet' | 'google') => void;
  addShortcut: (entry: ShortcutEntry) => void;
  removeShortcut: (key: string) => void;
  updateShortcut: (oldKey: string, newEntry: ShortcutEntry) => void;
  openSettings: () => void;
  closeSettings: () => void;
};

const STORAGE_KEY = 'mk-account-settings';

function loadFromStorage(): { darkMode: boolean; quietMode: boolean; theme: 'brutal' | 'quiet' | 'google'; shortcuts: ShortcutEntry[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        darkMode: !!parsed.darkMode,
        quietMode: !!parsed.quietMode,
        theme: parsed.theme || (parsed.quietMode ? 'quiet' : 'brutal'),
        shortcuts: parsed.shortcuts || [],
      };
    }
  } catch { /* ignore */ }
  return { darkMode: false, quietMode: false, theme: 'brutal', shortcuts: [] };
}

function saveToStorage(darkMode: boolean, quietMode: boolean, theme: 'brutal' | 'quiet' | 'google', shortcuts: ShortcutEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ darkMode, quietMode, theme, shortcuts }));
}

const initial = loadFromStorage();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode: initial.darkMode,
  quietMode: initial.quietMode,
  theme: initial.theme,
  shortcuts: initial.shortcuts,
  isSettingsOpen: false,

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    saveToStorage(next, get().quietMode, get().theme, get().shortcuts);
  },
  setDarkMode: (v) => {
    set({ darkMode: v });
    saveToStorage(v, get().quietMode, get().theme, get().shortcuts);
  },
  toggleQuietMode: () => {
    const next = !get().quietMode;
    const nextTheme = next ? 'quiet' : 'brutal';
    set({ quietMode: next, theme: nextTheme });
    saveToStorage(get().darkMode, next, nextTheme, get().shortcuts);
  },
  setTheme: (theme) => {
    set({ theme, quietMode: theme === 'quiet' });
    saveToStorage(get().darkMode, theme === 'quiet', theme, get().shortcuts);
  },

  addShortcut: (entry) => {
    const updated = [...get().shortcuts.filter(s => s.key !== entry.key), entry];
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, get().quietMode, get().theme, updated);
  },
  removeShortcut: (key) => {
    const updated = get().shortcuts.filter(s => s.key !== key);
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, get().quietMode, get().theme, updated);
  },
  updateShortcut: (oldKey, newEntry) => {
    const updated = get().shortcuts.map(s => s.key === oldKey ? newEntry : s);
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, get().quietMode, get().theme, updated);
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));

