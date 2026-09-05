import { create } from 'zustand';

interface LoaderStore {
  loadingCount: number;
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

export const useLoaderStore = create<LoaderStore>((set, get) => ({
  loadingCount: 0,
  isLoading: false,
  showLoader: () => {
    const newCount = get().loadingCount + 1;
    set({
      loadingCount: newCount,
      isLoading: true,
    });
  },
  hideLoader: () => {
    const currentCount = get().loadingCount;
    const newCount = Math.max(0, currentCount - 1); // Avoid negative values
    set({
      loadingCount: newCount,
      isLoading: newCount > 0,
    });
  },
}));
