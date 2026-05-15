import { create } from 'zustand';

export type ShortcutEntry = { key: string; moduleId: string };

type SettingsState = {
  darkMode: boolean;
  shortcuts: ShortcutEntry[];
  isSettingsOpen: boolean;

  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
  addShortcut: (entry: ShortcutEntry) => void;
  removeShortcut: (key: string) => void;
  updateShortcut: (oldKey: string, newEntry: ShortcutEntry) => void;
  openSettings: () => void;
  closeSettings: () => void;
};

const STORAGE_KEY = 'mk-account-settings';

function loadFromStorage(): { darkMode: boolean; shortcuts: ShortcutEntry[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { darkMode: false, shortcuts: [] };
}

function saveToStorage(darkMode: boolean, shortcuts: ShortcutEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ darkMode, shortcuts }));
}

const initial = loadFromStorage();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode: initial.darkMode,
  shortcuts: initial.shortcuts,
  isSettingsOpen: false,

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    saveToStorage(next, get().shortcuts);
  },
  setDarkMode: (v) => {
    set({ darkMode: v });
    saveToStorage(v, get().shortcuts);
  },

  addShortcut: (entry) => {
    const updated = [...get().shortcuts.filter(s => s.key !== entry.key), entry];
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, updated);
  },
  removeShortcut: (key) => {
    const updated = get().shortcuts.filter(s => s.key !== key);
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, updated);
  },
  updateShortcut: (oldKey, newEntry) => {
    const updated = get().shortcuts.map(s => s.key === oldKey ? newEntry : s);
    set({ shortcuts: updated });
    saveToStorage(get().darkMode, updated);
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
