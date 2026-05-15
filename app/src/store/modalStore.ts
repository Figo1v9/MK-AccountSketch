import { create } from 'zustand'

export type StepField = { l: string, v: number|string, u: string };
export type StepDataBlock = 
    | { type: 'header', text: string }
    | { type: 'latex', latex: string }
    | { type: 'text', text: string };

export type StepsData = { 
    title: string, 
    latex: string, 
    formula: string, 
    inputs: StepField[], 
    outputs: StepField[],
    customSteps?: StepDataBlock[] 
};

type ModalState = {
    isOpen: boolean;
    title: string;
    latex: string;
    
    isStepsOpen: boolean;
    stepsData: StepsData | null;
    
    openModal: (title: string, latex: string) => void;
    closeModal: () => void;
    
    openSteps: (data: StepsData) => void;
    closeSteps: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    title: '',
    latex: '',
    
    isStepsOpen: false,
    stepsData: null,
    
    openModal: (title, latex) => set({ isOpen: true, title, latex }),
    closeModal: () => set({ isOpen: false, title: '', latex: '' }),
    
    openSteps: (data) => set({ isStepsOpen: true, stepsData: data }),
    closeSteps: () => set({ isStepsOpen: false, stepsData: null }),
}));
