import React, { useMemo } from 'react';
import { useAccountStore } from '@/store/accountStore';
import { MODULES } from '@/core/modules';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText, FileSpreadsheet, BarChart3, Sparkles, Receipt, Calendar, Hash, Printer } from 'lucide-react';
import { useTranslation, useDynamicTranslation, useI18nStore } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { getNodeThemeStyle } from '@/core/themeColors';
import { GoogleIcon } from '@/components/ui/GoogleMulticolorIcons';


export const SummaryPanel = React.memo(() => {
  const { nodes } = useAccountStore();
  const theme = useSettingsStore(state => state.theme);
  const darkMode = useSettingsStore(state => state.darkMode);
  const isGoogle = theme === 'google';
  const t = useTranslation();
  const td = useDynamicTranslation();
  const lang = useI18nStore(state => state.lang);
  
  const activeNodes = nodes.filter(n => 
    Object.values(n.data.vals).some(v => v !== null && v !== undefined)
  );

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [lang]);

  const invoiceNumber = useMemo(() => {
    const d = new Date();
    return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const handleCopy = () => {
    let out = `${t('summary.clipboard_title')}\n` + "=".repeat(30) + "\n\n";
    activeNodes.forEach(m => {
        const def = MODULES.find(d => d.id === m.data.defId);
        if(!def) return;
        out += `[ ${td(def.title)} ]\n`;
        def.fields.forEach(f => { 
            const val = m.data.vals[f.k];
            if(val !== null && val !== undefined) {
                out += `• ${td(f.l)}: ${formatCurrency(val)} ${td(f.u)}\n`; 
            }
        });
        out += "\n";
    });
    navigator.clipboard.writeText(out);
    alert(t('summary.copied'));
  };

  const handleExportPDF = async () => {
    const module = await import('@/lib/pdfExport');
    module.generatePDF(nodes);
  };

  const handleExportExcel = async () => {
    const module = await import('@/features/excel/excelUtils');
    module.exportToExcelCSV(nodes);
  };

  return (
    <aside className="brutal-panel invoice-panel relative">
      {/* ── Invoice Header ── */}
      <div className="invoice-header">
        <div className="invoice-header-top">
          <div className="invoice-brand">
            <Receipt size={18} strokeWidth={2.5} className="invoice-brand-icon" />
            <span className="invoice-brand-text">{t('summary.title')}</span>
          </div>
          <div className="invoice-actions">
            <button 
              onClick={handleExportPDF} 
              title={t('summary.save_pdf')} 
              className="invoice-action-btn"
            >
              <FileText size={14} strokeWidth={2.2} />
              <span>PDF</span>
            </button>
            <button 
              onClick={handleExportExcel} 
              title={t('summary.export_excel')} 
              className="invoice-action-btn"
            >
              <FileSpreadsheet size={14} strokeWidth={2.2} />
            </button>
            <button 
              onClick={handleCopy} 
              title={t('summary.copy')} 
              className="invoice-action-btn"
            >
              <Download size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Invoice Meta Row */}
        <div className="invoice-meta">
          <div className="invoice-meta-item">
            <Hash size={11} strokeWidth={2.5} />
            <span>{invoiceNumber}</span>
          </div>
          <div className="invoice-meta-item">
            <Calendar size={11} strokeWidth={2.5} />
            <span>{today}</span>
          </div>
          <div className="invoice-meta-item">
            <BarChart3 size={11} strokeWidth={2.5} />
            <span>{activeNodes.length} {lang === 'ar' ? 'بند' : 'items'}</span>
          </div>
        </div>
      </div>

      {/* ── Tear Edge Decoration ── */}
      <div className="invoice-tear-edge" aria-hidden="true"></div>

      {/* ── Invoice Body ── */}
      <div id="rcon" className="invoice-body">
        {activeNodes.length === 0 ? (
          <div className="invoice-empty">
            <div className="invoice-empty-icon">
              <Receipt size={40} strokeWidth={1.2} />
            </div>
            <div className="invoice-empty-title">{t('summary.empty_state')}</div>
            <div className="invoice-empty-hint">{t('summary.empty_hint')}</div>
          </div>
        ) : (
          <>
            {activeNodes.map((m, nodeIndex) => {
              const def = MODULES.find(d => d.id === m.data.defId);
              if (!def) return null;
              const tStyle = getNodeThemeStyle(m.data.defId, theme, darkMode, def.color);
              const filledFields = def.fields.filter(f => {
                const val = m.data.vals[f.k];
                return val !== null && val !== undefined;
              });

              return (
                <div 
                  key={m.id} 
                  data-def-id={def.id} 
                  className="invoice-section" 
                  style={{
                    '--section-color': isGoogle ? tStyle.primaryColor : def.color,
                  } as React.CSSProperties}
                >
                  {/* Section Header - like invoice line item group */}
                  <div className="invoice-section-header">
                    <div className="invoice-section-icon">
                      <GoogleIcon id={def.id} fallbackEmoji={def.icon} size={16} />
                    </div>
                    <span className="invoice-section-title">{td(def.title)}</span>
                    <span className="invoice-section-number">#{String(nodeIndex + 1).padStart(2, '0')}</span>
                  </div>

                  {/* Section Rows - alternating */}
                  <div className="invoice-rows">
                    {filledFields.map((f, rowIndex) => {
                      const val = m.data.vals[f.k];
                      const isCalc = m.data.calcKeys.includes(f.k);
                      return (
                        <div 
                          key={f.k} 
                          className={`invoice-row ${rowIndex % 2 === 0 ? 'invoice-row--even' : ''} ${isCalc ? 'invoice-row--calc' : ''}`}
                        >
                          <span className="invoice-row-label">
                            {td(f.l)}
                            {isCalc && <Sparkles size={10} strokeWidth={2.5} className="invoice-calc-icon" />}
                          </span>
                          <span className="invoice-row-dots"></span>
                          <span className="invoice-row-value" dir="ltr" lang="en">
                            {formatCurrency(val as number)}
                            <span className="invoice-row-unit" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
                              {td(f.u)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Invoice Footer Totals Bar */}
            <div className="invoice-footer">
              <div className="invoice-footer-line">
                <span>{lang === 'ar' ? 'إجمالي الوحدات المحللة' : 'Total Analyzed Modules'}</span>
                <span className="invoice-footer-value">{activeNodes.length}</span>
              </div>
              <div className="invoice-footer-line">
                <span>{lang === 'ar' ? 'إجمالي البنود' : 'Total Line Items'}</span>
                <span className="invoice-footer-value">
                  {activeNodes.reduce((sum, m) => {
                    const def = MODULES.find(d => d.id === m.data.defId);
                    if (!def) return sum;
                    return sum + def.fields.filter(f => m.data.vals[f.k] !== null && m.data.vals[f.k] !== undefined).length;
                  }, 0)}
                </span>
              </div>
            </div>

            {/* Watermark */}
            <div className="invoice-watermark" aria-hidden="true">
              AccountSketch
            </div>
          </>
        )}
      </div>
    </aside>
  );
});

SummaryPanel.displayName = 'SummaryPanel';
