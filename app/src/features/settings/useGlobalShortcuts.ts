import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAccountActions } from '@/store/accountStore';
import type { AccountNode } from '@/store/accountStore';
import { useReactFlow } from '@xyflow/react';

/**
 * Global keyboard shortcut listener.
 * When user presses a registered Ctrl/Alt+Key combo,
 * it adds the corresponding module at the current mouse position.
 */
export function useGlobalShortcuts() {
  const shortcuts = useSettingsStore(s => s.shortcuts);
  const isSettingsOpen = useSettingsStore(s => s.isSettingsOpen);
  const { addNode } = useAccountActions();
  const { screenToFlowPosition } = useReactFlow();

  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Track global mouse position to drop nodes exactly where the cursor is
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isSettingsOpen) return; // Don't trigger during settings capture

    const handler = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const isEditable = activeEl.getAttribute('contenteditable') === 'true' || activeEl.getAttribute('contenteditable') === '';
        if (tagName === 'input' || tagName === 'textarea' || isEditable) {
          return;
        }
      }

      if (!e.ctrlKey && !e.altKey) return;
      const prefix = e.ctrlKey ? 'ctrl' : 'alt';
      const key = e.key.toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;

      const combo = `${prefix}+${key}`;
      const match = shortcuts.find(s => s.key === combo);
      if (!match) return;

      e.preventDefault();
      e.stopPropagation();

      // Convert global mouse screen coordinates to React Flow canvas coordinates
      const position = screenToFlowPosition({
        x: mousePos.current.x,
        y: mousePos.current.y,
      });

      const newNode: AccountNode = {
        id: `shortcut-${match.moduleId}-${Date.now()}`,
        type: 'brutalNode',
        position,
        data: { defId: match.moduleId, vals: {}, calcKeys: [], manualKeys: [] },
      };

      addNode(newNode);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, isSettingsOpen, addNode, screenToFlowPosition]);
}
