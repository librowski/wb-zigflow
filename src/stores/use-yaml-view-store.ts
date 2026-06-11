import { create } from 'zustand';

type YamlViewState = {
  open: boolean;
};

export const useYamlViewStore = create<YamlViewState>(() => ({
  open: false,
}));
