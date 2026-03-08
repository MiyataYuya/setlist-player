import { useRef, useCallback, useEffect } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import Box from "@mui/material/Box";
import {
  usePlayerStore,
  useCurrentSong,
  getPlayerRef,
  setPlayerRef,
} from "../../stores/playerStore";
import { useAutoAdvance } from "../../hooks/useAutoAdvance";

export default function YouTubeEmbed() {
  const currentSong = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playNext = usePlayerStore((s) => s.playNext);

  const prevPerfIdRef = useRef<string | null>(null);

  useAutoAdvance();

  useEffect(() => {
    if (!currentSong) return;
    const player = getPlayerRef();
    if (!player) return;

    if (prevPerfIdRef.current !== currentSong.performanceId) {
      prevPerfIdRef.current = currentSong.performanceId;
      try {
        const currentVideoUrl = player.getVideoUrl?.() ?? "";
        const isSameVideo = currentVideoUrl.includes(currentSong.videoId);
        if (isSameVideo) {
          player.seekTo(currentSong.startSeconds, true);
          player.playVideo();
        } else {
          player.loadVideoById({
            videoId: currentSong.videoId,
            startSeconds: currentSong.startSeconds,
          });
        }
      } catch {
        player.loadVideoById({
          videoId: currentSong.videoId,
          startSeconds: currentSong.startSeconds,
        });
      }
    }
  }, [currentSong]);

  useEffect(() => {
    const player = getPlayerRef();
    if (!player) return;
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying]);

  const onReady = useCallback((e: YouTubeEvent) => {
    setPlayerRef(e.target);
  }, []);

  const onStateChange = useCallback(
    (e: YouTubeEvent) => {
      if (e.data === 0) {
        playNext();
      } else if (e.data === 1) {
        setIsPlaying(true);
      } else if (e.data === 2) {
        setIsPlaying(false);
      }
    },
    [playNext, setIsPlaying]
  );

  if (!currentSong) return null;

  return (
    <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }}>
      <YouTube
        videoId={currentSong.videoId}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            start: currentSong.startSeconds,
            controls: 1,
            modestbranding: 1,
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        style={{ width: "100%", height: "100%" }}
        iframeClassName="youtube-iframe"
      />
    </Box>
  );
}
