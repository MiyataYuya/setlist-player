import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useCatalog } from "../stores/catalogStore";
import { formatJstDate } from "../data/jstDate";
import { usePlaylistStore } from "../stores/playlistStore";
import { useRecentSongs } from "../hooks/useRecentSongs";
import HomeSection from "../components/home/HomeSection";
import SongCard from "../components/songs/SongCard";
import PlaylistTile from "../components/home/PlaylistTile";
import { cleanStreamTitle } from "../data/streamTitle";
import type { CardVariant } from "../components/songs/cardGrid";

/**
 * ホームのセクションは件数の少ない「入口」なので並べ方を固定する。
 * 表示方法（リスト/タイル/グリッド）の設定は一覧画面のもので、ここには効かせない。
 * HomeSection のグリッド（タイル幅の多列）に合わせて横向きカードで並べる。
 */
const SECTION_CARD_VARIANT: CardVariant = "horizontal";

/** 各グリッドに出す上限（最新配信だけは配信単位で完結するため打ち切らない） */
const GRID_LIMIT = 6;

export default function HomePage() {
  const { streams } = useCatalog();
  // 上限ちょうどしか取らないと「超過しているか」が判定できず、
  // 「すべて表示」が永久に出ない。1件多く取って判定する。
  const recentSongs = useRecentSongs(GRID_LIMIT + 1);
  const playlists = usePlaylistStore((s) => s.playlists);
  const latestStream = streams[0];
  // 毎レンダーで新しい配列になると SongCard の memo が効かないので固定する
  const shownRecentSongs = useMemo(
    () => recentSongs.slice(0, GRID_LIMIT),
    [recentSongs]
  );

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h5">ホーム</Typography>
      </Box>

      {latestStream && (
        <HomeSection
          title="最新の配信"
          subtitle={`${cleanStreamTitle(latestStream.title)} ・ ${formatJstDate(
            latestStream.publishedAt
          )}`}
          itemCount={latestStream.songs.length}
        >
          {latestStream.songs.map((song) => (
            <SongCard
              key={song.performanceId}
              song={song}
              queue={latestStream.songs}
              variant={SECTION_CARD_VARIANT}
            />
          ))}
        </HomeSection>
      )}

      <HomeSection
        title="最近再生した曲"
        itemCount={recentSongs.length}
        shownCount={GRID_LIMIT}
        seeAllPath="/library"
      >
        {shownRecentSongs.map((song) => (
          <SongCard
            key={song.performanceId}
            song={song}
            queue={shownRecentSongs}
            variant={SECTION_CARD_VARIANT}
          />
        ))}
      </HomeSection>

      <HomeSection
        title="プレイリスト"
        itemCount={playlists.length}
        shownCount={GRID_LIMIT}
        seeAllPath="/library"
      >
        {playlists.slice(0, GRID_LIMIT).map((playlist) => (
          <PlaylistTile
            key={playlist.id}
            playlist={playlist}
            variant={SECTION_CARD_VARIANT}
          />
        ))}
      </HomeSection>

      <Box sx={{ px: 2 }}>
        <Link
          component={RouterLink}
          to="/search"
          variant="body2"
          underline="hover"
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          すべての曲を見る
          <ChevronRightIcon fontSize="small" />
        </Link>
      </Box>
    </Box>
  );
}
