import { create } from 'zustand';

type ImportState = {
  open: boolean;
  error: string | null;
};

export const useImportStore = create<ImportState>(() => ({
  open: false,
  error: null,
}));
