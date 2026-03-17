import { create } from 'zustand'

type ModalState = {
    isOpen: boolean;
    title: string;
    latex: string;
    openModal: (title: string, latex: string) => void;
    closeModal: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    title: '',
    latex: '',
    openModal: (title, latex) => set({ isOpen: true, title, latex }),
    closeModal: () => set({ isOpen: false, title: '', latex: '' }),
}));
