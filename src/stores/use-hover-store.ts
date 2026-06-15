import { create } from 'zustand';

// The task name currently hovered, in either direction: hover a canvas node →
// its YAML section highlights and scrolls into view; hover a YAML section → its
// node outlines. Keyed by task name (matches taskStates / the serializer).
export const useHoverStore = create<{ taskName: string | null }>(() => ({ taskName: null }));

export function setHoveredTask(taskName: string | null): void {
  useHoverStore.setState({ taskName });
}
