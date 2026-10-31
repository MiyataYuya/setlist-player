import type { SongViewMode } from "../../stores/layoutStore";

/** カードの向き。曲カードもプレイリストタイルもこの2種類 */
export type CardVariant = "horizontal" | "vertical";

/** 横向きカードのサムネ幅。曲カードとプレイリストタイルで揃える */
export const CARD_THUMBNAIL_WIDTH = 56;

/**
 * 表示モードごとのレイアウト。列の取り方とカードの向きを1箇所で決める。
 *
 * レスポンシブはCSSのブレークポイントではなくモードの既定値（PC=タイル /
 * モバイル=リスト、`useSongViewMode`）で担保する。列幅まで画面幅で分岐させると
 * 「モードで決まる」という約束が二重になって追いにくくなるため。
 * なお tile は幅が足りなければ1列に畳まれるので、狭い画面では list と同じ見た目になる。
 *
 * Record にすることで、モードを増やしたときに3つすべての指定を書くまで
 * 型エラーになる（ternary だと黙って既定側に倒れる）。
 */
const LAYOUT: Record<
  SongViewMode,
  { columns: string; song: CardVariant; playlist: CardVariant }
> = {
  list: { columns: "1fr", song: "horizontal", playlist: "horizontal" },
  tile: {
    columns: "repeat(auto-fill, minmax(220px, 1fr))",
    song: "horizontal",
    playlist: "vertical",
  },
  grid: {
    columns: "repeat(auto-fill, minmax(160px, 1fr))",
    song: "vertical",
    playlist: "vertical",
  },
};

/** 表示モードに応じたカードの並べ方（戻り値の型は推論に任せる。
 *  SxProps は関数や配列も含む広い型で、スプレッドすると静かに壊れうる） */
export function songGridSx(mode: SongViewMode) {
  return {
    display: "grid",
    gridTemplateColumns: LAYOUT[mode].columns,
    gap: 1,
  };
}

export function songCardVariant(mode: SongViewMode): CardVariant {
  return LAYOUT[mode].song;
}

/** プレイリストは大サムネが基本。1列表示だと全幅の画像になって不格好なので横向きにする */
export function playlistTileVariant(mode: SongViewMode): CardVariant {
  return LAYOUT[mode].playlist;
}
