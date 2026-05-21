import { useState, useRef, useCallback, useEffect } from 'react';
import { MODULES } from '@/core/modules';
import { useAccountStore, AccountNode } from '@/store/accountStore';
import { ScanLine, Upload, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation, useDynamicTranslation, useI18nStore } from '@/lib/i18n';
import { GoogleIcon } from '@/components/ui/GoogleMulticolorIcons';

const GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || 'AIzaSyB2q9oxgu7ySyKykHTrND0ja6M97JVWZUQ';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

type OcrResult = {
  modules: { moduleId: string; values: Record<string, number> }[];
  summary: string;
};

const SYSTEM_PROMPT = `You are an expert Arabic accounting problem solver.
Analyze the image of an accounting problem. Extract ALL numerical data and identify which module(s) to use.

Available modules (use EXACT id values):
${MODULES.map(m => `- id:"${m.id}" (${m.title}) fields: ${m.fields.map(f => `${f.k}="${f.l}"`).join(', ')}`).join('\n')}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no explanation.
2. Use the exact field keys (k values) from the modules above.
3. Numbers must be plain numbers (no commas, no currency symbols).
4. If a problem needs multiple modules, return all of them.
5. Include a short Arabic summary of what you extracted.

Response format (strict JSON):
{
  "modules": [
    { "moduleId": "exact_module_id", "values": { "field_key": number_value } }
  ],
  "summary": "ملخص قصير بالعربي"
}`;

export const OcrModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addNode } = useAccountStore();
  const t = useTranslation();
  const td = useDynamicTranslation();
  const lang = useI18nStore(state => state.lang);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const close = () => {
    setIsOpen(false);
    reset();
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processImage = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setLoading(true);

    const dataUrl = URL.createObjectURL(file);
    setPreview(dataUrl);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/png';

      const body = {
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      };

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(t('ocr.no_valid_data'));

      const parsed: OcrResult = JSON.parse(jsonMatch[0]);
      setResult(parsed);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('ocr.unexpected_error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('ocr.image_only'));
      return;
    }
    processImage(file);
  }, [processImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) handleFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, handleFile]);

  const applyResults = () => {
    if (!result) return;

    result.modules.forEach((item, idx) => {
      const modDef = MODULES.find(m => m.id === item.moduleId);
      if (!modDef) return;

      const vals: Record<string, number | null> = {};
      const manualKeys: string[] = [];

      modDef.fields.forEach(f => {
        if (item.values[f.k] !== undefined && item.values[f.k] !== null) {
          vals[f.k] = item.values[f.k];
          manualKeys.push(f.k);
        } else {
          vals[f.k] = null;
        }
      });

      // Run the solver
      const solved = modDef.solver({ ...vals });
      const calcKeys = Object.keys(solved).filter(
        k => solved[k] !== null && !manualKeys.includes(k) && !k.startsWith('_')
      );

      const newNode: AccountNode = {
        id: `ocr-${Date.now()}-${idx}`,
        type: 'brutalNode',
        position: { x: 160 + idx * 420, y: 120 },
        data: {
          defId: modDef.id,
          vals: solved as Record<string, number | null>,
          calcKeys,
          manualKeys,
        }
      };

      addNode(newNode);
    });

    close();
  };

  if (!isOpen) {
    return (
      <button
        className="brutal-btn ocr-trigger animate-pulse-subtle"
        onClick={() => setIsOpen(true)}
      >
        <ScanLine size={18} strokeWidth={3} />
        OCR
      </button>
    );
  }

  return (
    <div className="ocr-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="ocr-modal" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="ocr-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScanLine size={22} strokeWidth={3} />
            <span>{t('ocr.title')}</span>
          </div>
          <button onClick={close} className="ocr-close"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="ocr-body">
          {!preview && !loading && (
            <div
              className={`ocr-dropzone ${dragActive ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={48} strokeWidth={1.5} style={{ opacity: 0.5 }} />
              <p style={{ fontWeight: 700, fontSize: 18 }}>{t('ocr.dropzone_text')}</p>
              <p style={{ opacity: 0.5, fontSize: 14 }}>{t('ocr.dropzone_hint')}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {loading && (
            <div className="ocr-loading">
              <Loader2 size={40} className="ocr-spin" />
              <p style={{ fontWeight: 700 }}>{t('ocr.analyzing')}</p>
              <p style={{ opacity: 0.5, fontSize: 14 }}>Gemini 2.5 Flash</p>
            </div>
          )}

          {preview && !loading && (
            <div className="ocr-preview-section">
              <img src={preview} alt="المسألة" className="ocr-preview-img" />
            </div>
          )}

          {error && (
            <div className="ocr-error">
              <span><AlertTriangle size={16} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: '-2px', marginInlineEnd: '4px' }} />{error}</span>
              <button onClick={reset} className="brutal-btn" style={{ fontSize: 13, padding: '4px 12px' }}>{t('ocr.retry')}</button>
            </div>
          )}

          {result && (
            <div className="ocr-results">
              <div className="ocr-summary">
                <Sparkles size={16} /> {result.summary}
              </div>
              <div className="ocr-modules-list">
                {result.modules.map((item, i) => {
                  const def = MODULES.find(m => m.id === item.moduleId);
                  if (!def) return <div key={i} className="ocr-mod-item ocr-mod-error">{t('ocr.module_not_found')}: {item.moduleId}</div>;
                  return (
                    <div key={i} className="ocr-mod-item" style={{ borderColor: def.color }}>
                      <div className="ocr-mod-title flex items-center gap-1.5">
                        <GoogleIcon id={def.id} fallbackEmoji={def.icon} size={18} className="shrink-0" />
                        <span>{td(def.title)}</span>
                      </div>
                      <div className="ocr-mod-fields">
                        {Object.entries(item.values).map(([k, v]) => {
                          const fld = def.fields.find(f => f.k === k);
                          return (
                            <div key={k} className="ocr-field-row">
                              <span>{fld ? td(fld.l) : k}</span>
                              <span dir="ltr" style={{ fontFamily: 'Outfit' }}>
                                {typeof v === 'number' ? v.toLocaleString('en-US') : v}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="brutal-btn ocr-apply-btn" onClick={applyResults}>
                <Sparkles size={16} /> {t('ocr.apply')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
