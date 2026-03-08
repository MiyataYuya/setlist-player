import { useRef, useCallback, useEffect, useMemo } from "react";
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

  // 初回マウント時の値を保持。react-youtube の shouldUpdateVideo / shouldResetPlayer を
  // 発火させないために、YouTube コンポーネントに渡す props を安定化する。
  // 曲の遷移はすべて useEffect 経由で player API を直接呼ぶ。
  const initialVideoIdRef = useRef(currentSong?.videoId ?? "");
  const initialStartRef = useRef(currentSong?.startSeconds ?? 0);
  const prevPerfIdRef = useRef<string | null>(
    currentSong?.performanceId ?? null,
  );

  // 曲遷移中フラグ: seekTo/loadVideoById の直後にYouTubeが発火する
  // state=2 (paused) を無視するため
  const transitioningRef = useRef(false);

  useAutoAdvance();

  // 曲が変わったら player API で直接 seek / load する
  useEffect(() => {
    if (!currentSong) return;
    const player = getPlayerRef();
    if (!player) return;

    if (prevPerfIdRef.current !== currentSong.performanceId) {
      prevPerfIdRef.current = currentSong.performanceId;
      transitioningRef.current = true;
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

  // ユーザー操作による再生/一時停止の同期
  // （遷移中は無視 — 遷移中のpause/playはonStateChangeで制御される）
  useEffect(() => {
    if (transitioningRef.current) return;
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
        // 動画の終端到達
        playNext();
      } else if (e.data === 1) {
        // 再生開始 — 遷移完了
        transitioningRef.current = false;
        setIsPlaying(true);
      } else if (e.data === 2) {
        // 一時停止 — 遷移中なら無視（seek/load中のpauseイベント）
        if (!transitioningRef.current) {
          setIsPlaying(false);
        }
      }
    },
    [playNext, setIsPlaying],
  );

  // react-youtube に渡す opts を安定化（start を固定して shouldUpdateVideo を防ぐ）
  const opts = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1 as const,
        start: initialStartRef.current,
        controls: 1 as const,
        modestbranding: 1 as const,
      },
    }),
    [],
  );

  if (!currentSong) return null;

  return (
    <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }}>
      <YouTube
        videoId={initialVideoIdRef.current}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        style={{ width: "100%", height: "100%" }}
        iframeClassName="youtube-iframe"
      />
    </Box>
  );
}
