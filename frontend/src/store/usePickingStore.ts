import { create } from 'zustand';

interface State {
  currentSO: string | null;
  setCurrentSO: (so: string) => void;
  reset: () => void;
}

export const usePickingStore = create<State>((set) => ({
  currentSO: null,
  setCurrentSO: (so) => set({ currentSO: so }),
  reset: () => set({ currentSO: null }),
}));