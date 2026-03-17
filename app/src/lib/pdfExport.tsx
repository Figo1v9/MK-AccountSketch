import { pdf, Font } from '@react-pdf/renderer';
import { AccountNode } from '@/store/accountStore';
import { SolutionDocument } from './SolutionDocument';

/**
 * Register Fonts for Arabic Support.
 * Using a simple relative path which Vite handles during dev and build.
 * If this fails, we resort to the public URL.
 */
Font.register({
  family: 'Cairo',
  src: '/Cairo-Regular.ttf'
});

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
