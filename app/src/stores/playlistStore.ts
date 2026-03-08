import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Playlist {
  id: string;
  name: string;
  performanceIds: string[];
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, performanceId: string) => void;
  removeFromPlaylist: (playlistId: string, performanceId: string) => void;
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set) => ({
      playlists: [],

      createPlaylist: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          playlists: [...s.playlists, { id, name, performanceIds: [] }],
        }));
        return id;
      },

      deletePlaylist: (id) =>
        set((s) => ({
          playlists: s.playlists.filter((p) => p.id !== id),
        })),

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        })),

      addToPlaylist: (playlistId, performanceId) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.performanceIds.includes(performanceId)) return p;
            return { ...p, performanceIds: [...p.performanceIds, performanceId] };
          }),
        })),

      removeFromPlaylist: (playlistId, performanceId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, performanceIds: p.performanceIds.filter((pid) => pid !== performanceId) }
              : p
          ),
        })),

      reorderPlaylist: (playlistId, fromIndex, toIndex) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const ids = [...p.performanceIds];
            const [removed] = ids.splice(fromIndex, 1);
            ids.splice(toIndex, 0, removed);
            return { ...p, performanceIds: ids };
          }),
        })),
    }),
    {
      name: "karaoke-playlists",
      partialize: (s) => ({ playlists: s.playlists }),
    }
  )
);
