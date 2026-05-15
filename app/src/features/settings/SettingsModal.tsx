import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { MODULES } from '@/core/modules';
import { Settings, X, Moon, Sun, Keyboard, Plus, Trash2 } from 'lucide-react';

const KEY_LABELS: Record<string, string> = {
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E',
  'f': 'F', 'g': 'G', 'h': 'H', 'i': 'I', 'j': 'J',
  'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N', 'o': 'O',
  'p': 'P', 'q': 'Q', 'r': 'R', 's': 'S', 't': 'T',
  'u': 'U', 'v': 'V', 'w': 'W', 'x': 'X', 'y': 'Y', 'z': 'Z',
};

export const SettingsModal = () => {
  const {
    isSettingsOpen, openSettings, closeSettings,
    darkMode, toggleDarkMode,
    shortcuts, addShortcut, removeShortcut,
  } = useSettingsStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newModuleId, setNewModuleId] = useState('');
  const [listeningForKey, setListeningForKey] = useState(false);
  const [capturedKey, setCapturedKey] = useState('');
  const keyListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Capture keyboard shortcut
  useEffect(() => {
    if (!listeningForKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only accept Ctrl+Key or Alt+Key combos
      if (!e.ctrlKey && !e.altKey) return;
      const prefix = e.ctrlKey ? 'ctrl' : 'alt';
      const key = e.key.toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;
      const combo = `${prefix}+${key}`;
      setCapturedKey(combo);
      setListeningForKey(false);
    };
    keyListenerRef.current = handler;
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listeningForKey]);

  const handleSaveShortcut = () => {
    if (!capturedKey || !newModuleId) return;
    // Check if key is already used
    const existing = shortcuts.find(s => s.key === capturedKey);
    if (existing) {
      alert(`هذا المفتاح مستخدم بالفعل للأداة: ${MODULES.find(m => m.id === existing.moduleId)?.title}`);
      return;
    }
    addShortcut({ key: capturedKey, moduleId: newModuleId });
    setIsAdding(false);
    setCapturedKey('');
    setNewModuleId('');
  };

  const formatKey = (combo: string) => {
    const parts = combo.split('+');
    const mod = parts[0] === 'ctrl' ? 'Ctrl' : 'Alt';
    const key = KEY_LABELS[parts[1]] || parts[1].toUpperCase();
    return `${mod} + ${key}`;
  };

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!isSettingsOpen) {
    return (
      <button
        className="brutal-btn settings-trigger"
        onClick={openSettings}
        title="الإعدادات"
        style={{
          background: '#f5f5f5',
          border: '3px solid #000',
          padding: '8px 12px',
        }}
      >
        <Settings size={18} strokeWidth={3} />
      </button>
    );
  }

  return (
    <div className="ocr-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}>
      <div className="settings-modal">
        {/* Header */}
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={22} strokeWidth={3} />
            <span>الإعدادات</span>
          </div>
          <button onClick={closeSettings} className="ocr-close"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="settings-body">

          {/* ── Dark Mode ── */}
          <div className="settings-section">
            <div className="settings-section-title">
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
              <span>المظهر</span>
            </div>
            <div className="dark-mode-toggle" onClick={toggleDarkMode}>
              <div className="toggle-track" data-active={darkMode}>
                <div className="toggle-thumb">
                  {darkMode ? <Moon size={14} /> : <Sun size={14} />}
                </div>
              </div>
              <span className="toggle-label">
                {darkMode ? '🌙 الوضع الداكن' : '☀️ الوضع الفاتح'}
              </span>
            </div>
          </div>

          {/* ── Keyboard Shortcuts ── */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Keyboard size={18} />
              <span>اختصارات لوحة المفاتيح</span>
            </div>
            <p className="settings-hint">خصّص مفتاح (Ctrl/Alt + حرف) لإضافة أداة مباشرة على اللوحة</p>

            {/* Existing shortcuts */}
            <div className="shortcuts-list">
              {shortcuts.length === 0 && !isAdding && (
                <div className="shortcuts-empty">
                  <Keyboard size={32} style={{ opacity: 0.3 }} />
                  <span>لم يتم إضافة اختصارات بعد</span>
                </div>
              )}
              {shortcuts.map((s) => {
                const mod = MODULES.find(m => m.id === s.moduleId);
                return (
                  <div key={s.key} className="shortcut-row">
                    <div className="shortcut-key-badge">{formatKey(s.key)}</div>
                    <div className="shortcut-arrow">→</div>
                    <div className="shortcut-module">
                      <span>{mod?.icon}</span> {mod?.title || s.moduleId}
                    </div>
                    <button
                      className="shortcut-delete"
                      onClick={() => removeShortcut(s.key)}
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add new shortcut */}
            {isAdding ? (
              <div className="shortcut-add-form">
                <div className="shortcut-form-row">
                  <label>① اختر الأداة:</label>
                  <select
                    className="shortcut-select"
                    value={newModuleId}
                    onChange={e => setNewModuleId(e.target.value)}
                  >
                    <option value="">— اختر أداة —</option>
                    {MODULES.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                    ))}
                  </select>
                </div>
                <div className="shortcut-form-row">
                  <label>② اضغط المفتاح:</label>
                  {!capturedKey ? (
                    <button
                      className={`shortcut-capture-btn ${listeningForKey ? 'listening' : ''}`}
                      onClick={() => setListeningForKey(true)}
                    >
                      {listeningForKey
                        ? '⌨️ اضغط Ctrl/Alt + حرف...'
                        : '🎯 اضغط لتسجيل المفتاح'}
                    </button>
                  ) : (
                    <div className="shortcut-captured">
                      <span className="shortcut-key-badge">{formatKey(capturedKey)}</span>
                      <button className="shortcut-recapture" onClick={() => { setCapturedKey(''); setListeningForKey(true); }}>تغيير</button>
                    </div>
                  )}
                </div>
                <div className="shortcut-form-actions">
                  <button
                    className="brutal-btn shortcut-save-btn"
                    onClick={handleSaveShortcut}
                    disabled={!capturedKey || !newModuleId}
                  >
                    ✅ حفظ الاختصار
                  </button>
                  <button
                    className="brutal-btn"
                    onClick={() => { setIsAdding(false); setCapturedKey(''); setNewModuleId(''); setListeningForKey(false); }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="brutal-btn shortcut-add-btn"
                onClick={() => setIsAdding(true)}
              >
                <Plus size={16} /> إضافة اختصار جديد
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
