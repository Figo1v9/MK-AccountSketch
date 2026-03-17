import { MODULES } from '@/core/modules';
import { AccountNode } from '@/store/accountStore';
import { formatCurrency } from '@/lib/utils';
import { 
  pdf, 
  Document, 
  Page, 
  View, 
  Text, 
  StyleSheet, 
  Font 
} from '@react-pdf/renderer';

/**
 * Register Fonts for Arabic Support
 * Note: @react-pdf/renderer requires .ttf files for custom fonts.
 * Using a reliable Google Fonts CDN link.
 */
Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpcWmhz6miu2xKthmx9V5mR.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Cairo',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 15,
  },
  docTitle: {
    fontSize: 22,
    marginBottom: 5,
  },
  docSubtitle: {
    fontSize: 12,
    color: '#333333',
  },
  stepContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  stepHeader: {
    backgroundColor: '#E5E5E5',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitleText: {
    fontSize: 14,
  },
  stepIndex: {
    fontSize: 12,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
  },
  lastTableRow: {
    flexDirection: 'row-reverse',
  },
  tableCellLabel: {
    width: '60%',
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#000000',
    fontSize: 11,
    textAlign: 'right',
  },
  tableCellValue: {
    width: '40%',
    padding: 10,
    fontSize: 11,
    textAlign: 'left',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 10,
    color: '#777777',
    borderTopWidth: 0.5,
    borderTopColor: '#DDDDDD',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 9,
    color: '#999999',
    marginTop: 5,
  }
});

/**
 * Functional component for the PDF Document structure
 */
const SolutionDocument = ({ nodes }: { nodes: AccountNode[] }) => {
  const activeNodes = nodes.filter(n =>
    Object.values(n.data.vals).some(v => v !== null && v !== undefined)
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.docTitle}>إجابة نموذجية — AccountSketch</Text>
          <Text style={styles.docSubtitle}>تقرير مفصل بالخطوات المحاسبية المنظمة</Text>
          <Text style={styles.dateText}>تاريخ التقرير: {dateStr}</Text>
        </View>

        {activeNodes.map((node, idx) => {
          const def = MODULES.find(d => d.id === node.data.defId);
          if (!def) return null;

          const fields = def.fields.filter(f => {
            const v = node.data.vals[f.k];
            return v !== null && v !== undefined;
          });

          return (
            <View key={node.id} style={styles.stepContainer} wrap={false}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitleText}>الخطوة {idx + 1}: {def.title}</Text>
                <Text style={styles.stepIndex}>مرحلة الحل</Text>
              </View>
              
              <View style={styles.table}>
                {fields.map((f, fIdx) => (
                  <View 
                    key={f.k} 
                    style={fIdx === fields.length - 1 ? styles.lastTableRow : styles.tableRow}
                  >
                    <View style={styles.tableCellLabel}>
                      <Text>{f.l}</Text>
                    </View>
                    <View style={styles.tableCellValue}>
                      <Text>{formatCurrency(node.data.vals[f.k]!)} {f.u}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>تم الإنشاء بواسطة AccountSketch Pro — جميع العمليات تمت بدقة حسابية عالية</Text>
          <Text render={({ pageNumber, totalPages }) => (
            `صفحة ${pageNumber} من ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};

/**
 * Core PDF Generation Trigger
 */
export const generatePDF = async (nodes: AccountNode[]) => {
  try {
    const activeNodes = nodes.filter(n =>
      Object.values(n.data.vals).some(v => v !== null && v !== undefined)
    );

    if (activeNodes.length === 0) {
      alert('لا توجد بيانات متاحة للتصدير');
      return;
    }

    const doc = <SolutionDocument nodes={nodes} />;
    const blob = await pdf(doc).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solution_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('حدث خطأ أثناء إنشاء ملف PDF');
  }
};
