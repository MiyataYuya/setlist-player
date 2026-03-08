import { useEffect } from "react";
import { usePlayerStore, useCurrentSong, getPlayerRef } from "../stores/playerStore";

/**
 * YouTube Playerの再生時刻を500msごとにポーリングし、
 * endSeconds到達で自動的に次の曲へ進む。
 */
export function useAutoAdvance(): void {
  const currentSong = useCurrentSong();
  const playNext = usePlayerStore((s) => s.playNext);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!currentSong || !isPlaying) return;

    const intervalId = setInterval(() => {
      const player = getPlayerRef();
      if (!player) return;
      try {
        const time = player.getCurrentTime();
        if (time >= currentSong.endSeconds) {
          playNext();
        }
      } catch {
        // player not ready
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [currentSong, isPlaying, playNext]);
}
