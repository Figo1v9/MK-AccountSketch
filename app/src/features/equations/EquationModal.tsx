import { useModalStore } from '@/store/modalStore';
import { X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';

export const EquationModal = () => {
    const { isOpen, title, latex, closeModal } = useModalStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <motion.div 
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] max-w-lg w-full p-0 flex flex-col"
                    >
                        <div className="flex justify-between items-center p-4 border-b-4 border-black bg-yellow-300">
                            <h2 className="text-xl font-black">{title}</h2>
                            <button onClick={closeModal} className="hover:bg-red-400 p-1 rounded-sm border-2 border-transparent hover:border-black transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div 
                            className="p-6 text-center overflow-x-auto text-[20px] font-bold" 
                            dir="ltr"
                            dangerouslySetInnerHTML={{ 
                                __html: katex.renderToString(latex, { 
                                    throwOnError: false, 
                                    strict: false,
                                    trust: true
                                }) 
                            }}
                        />
                        <div className="p-4 border-t-4 border-black bg-gray-100 flex justify-end">
                            <button onClick={closeModal} className="brutal-btn bg-white">
                                إغلاق
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
