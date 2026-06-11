import { create } from 'zustand';

type ExportState = {
  open: boolean;
  yaml: string | null;
  error: string | null;
};

export const useExportStore = create<ExportState>(() => ({
  open: false,
  yaml: null,
  error: null,
}));
