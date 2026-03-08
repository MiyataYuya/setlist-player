import { useRef, useCallback, useEffect } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import Box from "@mui/material/Box";
import { usePlayerStore, useCurrentSong } from "../../stores/playerStore";
import { useAutoAdvance } from "../../hooks/useAutoAdvance";

export default function YouTubeEmbed() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const currentSong = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playNext = usePlayerStore((s) => s.playNext);

  // 前回のperformanceIdを追跡して曲変更を検知
  const prevPerfIdRef = useRef<string | null>(null);

  useAutoAdvance(playerRef, currentSong);

  // 曲が変わった時の処理
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentSong) return;

    if (prevPerfIdRef.current !== currentSong.performanceId) {
      prevPerfIdRef.current = currentSong.performanceId;
      // 同じ動画なら seekTo、違う動画なら loadVideoById
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

  // 再生/一時停止の反映
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying]);

  const onReady = useCallback((e: YouTubeEvent) => {
    playerRef.current = e.target;
  }, []);

  const onStateChange = useCallback(
    (e: YouTubeEvent) => {
      // YT.PlayerState: 0=ENDED, 1=PLAYING, 2=PAUSED
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
