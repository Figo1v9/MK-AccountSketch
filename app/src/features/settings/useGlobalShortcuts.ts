import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAccountStore } from '@/store/accountStore';
import type { AccountNode } from '@/store/accountStore';

/**
 * Global keyboard shortcut listener.
 * When user presses a registered Ctrl/Alt+Key combo,
 * it adds the corresponding module to the canvas center.
 */
export function useGlobalShortcuts() {
  const shortcuts = useSettingsStore(s => s.shortcuts);
  const isSettingsOpen = useSettingsStore(s => s.isSettingsOpen);
  const addNode = useAccountStore(s => s.addNode);

  useEffect(() => {
    if (isSettingsOpen) return; // Don't trigger during settings capture

    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.altKey) return;
      const prefix = e.ctrlKey ? 'ctrl' : 'alt';
      const key = e.key.toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;

      const combo = `${prefix}+${key}`;
      const match = shortcuts.find(s => s.key === combo);
      if (!match) return;

      e.preventDefault();
      e.stopPropagation();

      // Add the module at a slightly random position in the center
      const offsetX = Math.floor(Math.random() * 200) + 100;
      const offsetY = Math.floor(Math.random() * 200) + 100;

      const newNode: AccountNode = {
        id: `shortcut-${match.moduleId}-${Date.now()}`,
        type: 'brutalNode',
        position: { x: offsetX, y: offsetY },
        data: { defId: match.moduleId, vals: {}, calcKeys: [], manualKeys: [] },
      };

      addNode(newNode);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, isSettingsOpen, addNode]);
}
