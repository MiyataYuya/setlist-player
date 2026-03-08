import { useEffect, type MutableRefObject } from "react";
import type { YouTubePlayer } from "react-youtube";
import type { SongPerformance } from "../data/types";
import { usePlayerStore } from "../stores/playerStore";

/**
 * YouTube Playerの再生時刻を500msごとにポーリングし、
 * endSeconds到達で自動的に次の曲へ進む。
 */
export function useAutoAdvance(
  playerRef: MutableRefObject<YouTubePlayer | null>,
  currentSong: SongPerformance | undefined
) {
  const playNext = usePlayerStore((s) => s.playNext);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!playerRef.current || !currentSong || !isPlaying) return;

    const intervalId = setInterval(async () => {
      try {
        const player = playerRef.current;
        if (!player) return;
        const time = player.getCurrentTime();
        if (time >= currentSong.endSeconds) {
          playNext();
        }
      } catch {
        // player not ready
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [playerRef, currentSong, isPlaying, playNext]);
}
