# アプリ化（PWA）と起動時CSV同期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** セトリプレイヤーをホーム画面に追加できる PWA にし、曲データ CSV をビルド時埋め込みから起動時取得（オフライン時は前回取得分）に切り替える。

**Architecture:** CSV は Vite プラグインで dev 配信／build 時に `dist/data/` へ出力し、アプリは起動時に `catalogStore` が `loadCatalog()` で取得・パース・結合する。`CatalogGate` が読み込み中／エラー／完了を出し分け、配下は `useCatalog()` で同期的にデータを読む。PWA は `vite-plugin-pwa`（generateSW）で、アプリ本体を precache、`data/*.csv` だけ NetworkFirst でランタイムキャッシュし、YouTube 由来は一切キャッシュしない。

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Zustand v5, MUI v7, papaparse, vite-plugin-pwa 2 (Workbox 7), Vitest 4 + Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-11-04-pwa-csv-sync-design.md`

## Global Constraints

- すべてのコマンドは `app/` で実行（`cd C:/Users/Public/project/Youtube_parser/app`）
- TDD: 失敗するテスト → 最小実装 → 緑 → コミット。テストを緩めない。`as any` / `@ts-ignore` 禁止
- UIテキスト・コメントは日本語
- Service Worker がキャッシュするのはアプリ本体とセトリCSVのみ。YouTube（埋め込み・`img.youtube.com`・IFrame API）は絶対にキャッシュしない
- CSV の取得先は `${import.meta.env.BASE_URL}data/<file>`。対象は `app_songs_enriched.csv`, `app_performances.csv`, `app_videos.csv` の3つ
- Vitest は `TZ=America/Los_Angeles`（`vitest.config.ts` で設定済み）。日付は `src/data/jstDate.ts` を通す
- コミット末尾に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 作業ブランチ: `feature/pwa-csv-sync`（作成済み）
- バージョン: `1.2.2` → `1.3.0`（最終タスク）

---

### Task 0: ベースライン記録

**Files:** なし（記録のみ）

- [ ] **Step 1: ユニットテスト・lint・ビルドが緑であることを確認**

Run: `npm run test && npm run lint && npm run build`
Expected: すべて成功。テスト件数を控える。

- [ ] **Step 2: E2E のベースラインを記録**

Run: `npx playwright test --reporter=line 2>&1 | tail -30`
Expected: 失敗する spec 名を控える（過去に MiniPlayer セレクタ起因で 7 件赤だった記録あり。現状の数を事実として記録し、Task 7 で比較する）。

---

### Task 1: CSV パースと Catalog 構築（純関数）

**Files:**
- Modify: `src/data/types.ts`（`Catalog` 追加）
- Create: `src/data/parseCatalog.ts`
- Create: `src/data/buildCatalog.ts`
- Create: `src/test/catalogFixture.ts`
- Test: `src/data/__tests__/parseCatalog.test.ts`, `src/data/__tests__/buildCatalog.test.ts`

**Interfaces:**
- Produces:
  - `interface Catalog { songs: Song[]; performances: Performance[]; videos: Video[]; songPerformances: SongPerformance[]; songPerformanceById: Map<string, SongPerformance>; streams: Stream[]; streamsByDate: Map<string, Stream[]>; streamDateKeys: string[]; calendarMonths: string[] }`（`types.ts`）
  - `parseSongsCsv(csv: string): Song[]`, `parsePerformancesCsv(csv: string): Performance[]`, `parseVideosCsv(csv: string): Video[]`
  - `interface CatalogSource { songs: Song[]; performances: Performance[]; videos: Video[] }`, `buildCatalog(source: CatalogSource): Catalog`
  - `src/test/catalogFixture.ts`: `fixtureSongs`, `fixturePerformances`, `fixtureVideos`, `testCatalog: Catalog`

- [ ] **Step 1: `Catalog` 型を追加**

`src/data/types.ts` の末尾に追加:

```ts
/** 起動時に取得したCSVから組み立てる、アプリ全体の曲データ */
export interface Catalog {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
  songPerformances: SongPerformance[];
  songPerformanceById: Map<string, SongPerformance>;
  /** 配信日時降順 */
  streams: Stream[];
  /** JSTの `YYYY-MM-DD` → その日の配信（同日内は開始が早い順） */
  streamsByDate: Map<string, Stream[]>;
  /** 配信がある日の `YYYY-MM-DD` 昇順 */
  streamDateKeys: string[];
  /** 配信のある最古の月から最新の月までの連続した `YYYY-MM` 昇順 */
  calendarMonths: string[];
}
```

- [ ] **Step 2: テスト用フィクスチャを作成**

`src/test/catalogFixture.ts`（データは `src/test/__mocks__/virtual*.ts` と同一。`performanceNote` を補う）:

```ts
import { buildCatalog } from "../data/buildCatalog";
import type { Catalog, Performance, Song, Video } from "../data/types";

export const fixtureSongs: Song[] = [
  { songId: "s1", title: "天体観測", artist: "BUMP OF CHICKEN", performanceNote: "" },
  { songId: "s2", title: "紅蓮華", artist: "LiSA", performanceNote: "" },
  { songId: "s3", title: "夜に駆ける", artist: "YOASOBI", performanceNote: "" },
  { songId: "s4", title: "Lemon", artist: "米津玄師", performanceNote: "" },
  { songId: "s5", title: "残酷な天使のテーゼ", artist: "高橋洋子", performanceNote: "" },
];

export const fixturePerformances: Performance[] = [
  { performanceId: "p1", songId: "s1", videoId: "v1", startSeconds: 0, endSeconds: 300, publishedAt: "2024-01-15T19:00:00Z" },
  { performanceId: "p2", songId: "s2", videoId: "v1", startSeconds: 310, endSeconds: 600, publishedAt: "2024-01-15T19:00:00Z" },
  { performanceId: "p3", songId: "s3", videoId: "v2", startSeconds: 0, endSeconds: 250, publishedAt: "2024-02-10T19:00:00Z" },
  { performanceId: "p4", songId: "s1", videoId: "v2", startSeconds: 260, endSeconds: 560, publishedAt: "2024-02-10T19:00:00Z" },
  { performanceId: "p5", songId: "s4", videoId: "v3", startSeconds: 0, endSeconds: 280, publishedAt: "2024-03-05T19:00:00Z" },
  { performanceId: "p6", songId: "s5", videoId: "v3", startSeconds: 290, endSeconds: 580, publishedAt: "2024-03-05T19:00:00Z" },
  { performanceId: "p7", songId: "s2", videoId: "v3", startSeconds: 590, endSeconds: 870, publishedAt: "2024-03-05T19:00:00Z" },
  { performanceId: "p8", songId: "s3", videoId: "v4", startSeconds: 0, endSeconds: 240, publishedAt: "2024-03-05T22:00:00Z" },
  { performanceId: "p9", songId: "s4", videoId: "v5", startSeconds: 0, endSeconds: 260, publishedAt: "2024-03-20T19:00:00Z" },
];

export const fixtureVideos: Video[] = [
  { videoId: "v1", publishedAt: "2024-01-15T19:00:00Z", title: "【歌枠】新年歌配信！", channelTitle: "テスト", duration: "PT1H", viewCount: 10000, likeCount: 500 },
  { videoId: "v2", publishedAt: "2024-02-10T19:00:00Z", title: "singing stream #歌枠 #karaoke", channelTitle: "テスト", duration: "PT1H30M", viewCount: 20000, likeCount: 1000 },
  { videoId: "v3", publishedAt: "2024-03-05T19:00:00Z", title: "歌配信 - ミナミイズミ ch", channelTitle: "テスト", duration: "PT2H", viewCount: 30000, likeCount: 1500 },
  // v4 は v3 と同じJST日（2024-03-06）＝「同じ日に2配信」のケース
  { videoId: "v4", publishedAt: "2024-03-05T22:00:00Z", title: "【コラボ】二人で歌枠", channelTitle: "テスト", duration: "PT1H", viewCount: 5000, likeCount: 300 },
  // v5 は同月の別日＝「1か月に複数の配信日」のケース
  { videoId: "v5", publishedAt: "2024-03-20T19:00:00Z", title: "【歌枠】春の歌配信", channelTitle: "テスト", duration: "PT1H", viewCount: 8000, likeCount: 400 },
];

/** テスト全体の既定データ（setup.ts で catalogStore に入れる） */
export const testCatalog: Catalog = buildCatalog({
  songs: fixtureSongs,
  performances: fixturePerformances,
  videos: fixtureVideos,
});
```

- [ ] **Step 3: パースの失敗テストを書く**

`src/data/__tests__/parseCatalog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseSongsCsv, parsePerformancesCsv, parseVideosCsv } from "../parseCatalog";

describe("parseSongsCsv", () => {
  // #1 列名をアプリの型へ写す
  it("maps CSV columns to Song", () => {
    const csv = "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n";
    expect(parseSongsCsv(csv)).toEqual([
      { songId: "song_0001", title: "天体観測", artist: "BUMP OF CHICKEN", performanceNote: "" },
    ]);
  });

  // #2 空行や song_id 空の行は除外
  it("skips rows without song_id", () => {
    const csv = "song_id,title,artist,performance_note\nsong_0001,A,X,\n,,,\n\n";
    expect(parseSongsCsv(csv)).toHaveLength(1);
  });

  // #3 必須列が無い（HTML 等の誤応答）なら黙って空にせず throw
  it("throws when a required column is missing", () => {
    expect(() => parseSongsCsv("<!doctype html><html></html>")).toThrow(/song_id/);
  });
});

describe("parsePerformancesCsv", () => {
  // #4 秒数を数値化
  it("converts seconds to numbers", () => {
    const csv =
      "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
      "perf_0001,song_0001,abc,12,345,2024-01-15T19:00:00Z\n";
    expect(parsePerformancesCsv(csv)).toEqual([
      {
        performanceId: "perf_0001",
        songId: "song_0001",
        videoId: "abc",
        startSeconds: 12,
        endSeconds: 345,
        publishedAt: "2024-01-15T19:00:00Z",
      },
    ]);
  });

  // #5 必須列欠落で throw
  it("throws when a required column is missing", () => {
    expect(() => parsePerformancesCsv("performance_id,song_id\nperf_0001,song_0001\n")).toThrow(/video_id/);
  });
});

describe("parseVideosCsv", () => {
  // #6 数値化し、空の再生数・高評価数は 0
  it("converts counts to numbers and defaults blanks to 0", () => {
    const csv =
      "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
      "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,1200,\n";
    expect(parseVideosCsv(csv)).toEqual([
      {
        videoId: "abc",
        publishedAt: "2024-01-15T19:00:00Z",
        title: "歌枠",
        channelTitle: "ch",
        duration: "PT1H",
        viewCount: 1200,
        likeCount: 0,
      },
    ]);
  });

  // #7 必須列欠落で throw
  it("throws when a required column is missing", () => {
    expect(() => parseVideosCsv("video_id\nabc\n")).toThrow(/title/);
  });
});
```

- [ ] **Step 4: 失敗を確認**

Run: `npx vitest run src/data/__tests__/parseCatalog.test.ts`
Expected: FAIL（`../parseCatalog` が解決できない）

- [ ] **Step 5: パースを実装**

`src/data/parseCatalog.ts`:

```ts
import Papa from "papaparse";
import type { Performance, Song, Video } from "./types";

interface RawSong {
  song_id: string;
  title: string;
  artist: string;
  performance_note?: string;
}

interface RawPerformance {
  performance_id: string;
  song_id: string;
  video_id: string;
  start_seconds: string;
  end_seconds: string;
  published_at: string;
}

interface RawVideo {
  video_id: string;
  published_at: string;
  title: string;
  channel_title: string;
  duration: string;
  view_count: string;
  like_count: string;
}

/**
 * ヘッダー付きCSVを行オブジェクトにする。必須列が欠けていたら throw する
 * （HTMLなどの誤応答を「0件のデータ」として黙って通さないため）。
 */
function parseRows<T>(csv: string, required: readonly (keyof T & string)[]): T[] {
  const { data, meta } = Papa.parse<T>(csv, { header: true, skipEmptyLines: true });
  const fields = meta.fields ?? [];
  const missing = required.filter((column) => !fields.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSVに必須列がありません: ${missing.join(", ")}`);
  }
  return data;
}

export function parseSongsCsv(csv: string): Song[] {
  return parseRows<RawSong>(csv, ["song_id", "title", "artist"])
    .filter((r) => r.song_id)
    .map((r) => ({
      songId: r.song_id,
      title: r.title,
      artist: r.artist,
      performanceNote: r.performance_note || "",
    }));
}

export function parsePerformancesCsv(csv: string): Performance[] {
  return parseRows<RawPerformance>(csv, [
    "performance_id",
    "song_id",
    "video_id",
    "start_seconds",
    "end_seconds",
    "published_at",
  ])
    .filter((r) => r.performance_id)
    .map((r) => ({
      performanceId: r.performance_id,
      songId: r.song_id,
      videoId: r.video_id,
      startSeconds: Number(r.start_seconds),
      endSeconds: Number(r.end_seconds),
      publishedAt: r.published_at,
    }));
}

export function parseVideosCsv(csv: string): Video[] {
  return parseRows<RawVideo>(csv, [
    "video_id",
    "published_at",
    "title",
    "channel_title",
    "duration",
    "view_count",
    "like_count",
  ])
    .filter((r) => r.video_id)
    .map((r) => ({
      videoId: r.video_id,
      publishedAt: r.published_at,
      title: r.title,
      channelTitle: r.channel_title,
      duration: r.duration,
      viewCount: Number(r.view_count) || 0,
      likeCount: Number(r.like_count) || 0,
    }));
}
```

- [ ] **Step 6: パースの緑を確認**

Run: `npx vitest run src/data/__tests__/parseCatalog.test.ts`
Expected: PASS（7件）

- [ ] **Step 7: 構築の失敗テストを書く**

`src/data/__tests__/buildCatalog.test.ts`（現 `songs.test.ts` と `calendar.test.ts` #11-12 を移植）:

```ts
import { describe, it, expect } from "vitest";
import { buildCatalog } from "../buildCatalog";
import { fixturePerformances, fixtureSongs, fixtureVideos } from "../../test/catalogFixture";

const catalog = buildCatalog({
  songs: fixtureSongs,
  performances: fixturePerformances,
  videos: fixtureVideos,
});

describe("buildCatalog", () => {
  // #1 Performance と Song を songId で結合
  it("joins performances with songs by songId", () => {
    const sp = catalog.songPerformances.find((s) => s.performanceId === "p1");
    expect(sp?.title).toBe("天体観測");
    expect(sp?.artist).toBe("BUMP OF CHICKEN");
    expect(sp?.videoId).toBe("v1");
  });

  // #2 サムネイルURLの形式
  it("generates thumbnailUrl in the YouTube format", () => {
    for (const sp of catalog.songPerformances) {
      expect(sp.thumbnailUrl).toBe(`https://img.youtube.com/vi/${sp.videoId}/mqdefault.jpg`);
    }
  });

  // #3 performanceId ルックアップ
  it("looks up a performance by id", () => {
    expect(catalog.songPerformanceById.get("p1")?.title).toBe("天体観測");
    expect(catalog.songPerformanceById.size).toBe(catalog.songPerformances.length);
    expect(catalog.songPerformanceById.get("nope")).toBeUndefined();
  });

  // #4 配信は videoId ごとに1件
  it("groups streams by videoId", () => {
    const ids = catalog.streams.map((s) => s.videoId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // #5 配信は日時降順
  it("sorts streams by publishedAt desc", () => {
    for (let i = 1; i < catalog.streams.length; i++) {
      expect(new Date(catalog.streams[i - 1].publishedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(catalog.streams[i].publishedAt).getTime()
      );
    }
  });

  // #6 配信のタイトル・再生数は Video から
  it("takes stream title and counts from videos", () => {
    expect(catalog.streams.find((s) => s.videoId === "v1")?.title).toBe("【歌枠】新年歌配信！");
    const v3 = catalog.streams.find((s) => s.videoId === "v3");
    expect(v3?.viewCount).toBe(30000);
    expect(v3?.likeCount).toBe(1500);
  });

  // #7 songCount は配信内の演奏数
  it("sets songCount to the number of performances in the stream", () => {
    for (const stream of catalog.streams) {
      expect(stream.songCount).toBe(stream.songs.length);
    }
  });

  // #8 カレンダーの月はフィクスチャの 2024-01〜03 を昇順で
  it("covers the months of the streams in ascending order", () => {
    expect(catalog.calendarMonths).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  // #9 JSTの日付で配信を引ける（UTC 19時は翌日）
  it("indexes streams by JST date", () => {
    expect(catalog.streamsByDate.get("2024-01-16")?.[0].videoId).toBe("v1");
  });

  // #10 配信日は昇順（v3/v4 は同じJST日なので1件）
  it("lists stream dates ascending without duplicates", () => {
    expect(catalog.streamDateKeys).toEqual(["2024-01-16", "2024-02-11", "2024-03-06", "2024-03-21"]);
  });

  // #11 配信が無ければカレンダー月も空
  it("returns no calendar months for an empty catalog", () => {
    const empty = buildCatalog({ songs: [], performances: [], videos: [] });
    expect(empty.calendarMonths).toEqual([]);
    expect(empty.streams).toEqual([]);
  });
});
```

- [ ] **Step 8: 失敗を確認**

Run: `npx vitest run src/data/__tests__/buildCatalog.test.ts`
Expected: FAIL（`../buildCatalog` が解決できない）

- [ ] **Step 9: 構築を実装**

`src/data/buildCatalog.ts`（`songs.ts` と `calendar.ts` のモジュールトップレベル計算を移した純関数）:

```ts
import { groupStreamsByJstDate, monthRange } from "./calendar";
import { toMonthKey } from "./jstDate";
import type { Catalog, Performance, Song, SongPerformance, Stream, Video } from "./types";

export interface CatalogSource {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
}

function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/** パース済みの3表から、画面が使う結合・集計済みデータを組み立てる */
export function buildCatalog({ songs, performances, videos }: CatalogSource): Catalog {
  const songMap = new Map(songs.map((s) => [s.songId, s]));
  const videoMap = new Map(videos.map((v) => [v.videoId, v]));

  const songPerformances: SongPerformance[] = performances.map((p) => {
    const song = songMap.get(p.songId);
    return {
      performanceId: p.performanceId,
      songId: p.songId,
      title: song?.title ?? "",
      artist: song?.artist ?? "",
      videoId: p.videoId,
      startSeconds: p.startSeconds,
      endSeconds: p.endSeconds,
      publishedAt: p.publishedAt,
      thumbnailUrl: thumbnailUrl(p.videoId),
    };
  });

  const songPerformanceById = new Map(songPerformances.map((sp) => [sp.performanceId, sp]));

  const byVideo = new Map<string, SongPerformance[]>();
  for (const sp of songPerformances) {
    const list = byVideo.get(sp.videoId) ?? [];
    list.push(sp);
    byVideo.set(sp.videoId, list);
  }
  const streams: Stream[] = Array.from(byVideo.entries())
    .map(([videoId, streamSongs]) => {
      const video = videoMap.get(videoId);
      return {
        videoId,
        publishedAt: streamSongs[0].publishedAt,
        title: video?.title ?? "",
        thumbnailUrl: thumbnailUrl(videoId),
        songCount: streamSongs.length,
        duration: video?.duration ?? "",
        viewCount: video?.viewCount ?? 0,
        likeCount: video?.likeCount ?? 0,
        songs: streamSongs,
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const streamsByDate = groupStreamsByJstDate(streams);
  const streamDateKeys = Array.from(streamsByDate.keys()).sort();
  const calendarMonths =
    streamDateKeys.length === 0
      ? []
      : monthRange(
          toMonthKey(streamDateKeys[0]),
          toMonthKey(streamDateKeys[streamDateKeys.length - 1])
        );

  return {
    songs,
    performances,
    videos,
    songPerformances,
    songPerformanceById,
    streams,
    streamsByDate,
    streamDateKeys,
    calendarMonths,
  };
}
```

- [ ] **Step 10: 緑と型を確認**

Run: `npx vitest run src/data/__tests__/ && npx tsc -b`
Expected: PASS / 型エラーなし

- [ ] **Step 11: コミット**

```bash
git add src/data/types.ts src/data/parseCatalog.ts src/data/buildCatalog.ts src/test/catalogFixture.ts src/data/__tests__/parseCatalog.test.ts src/data/__tests__/buildCatalog.test.ts
git commit -m "feat: CSVパースとCatalog構築を純関数として追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: CSV 取得と catalogStore

**Files:**
- Create: `src/data/loadCatalog.ts`
- Create: `src/stores/catalogStore.ts`
- Test: `src/data/__tests__/loadCatalog.test.ts`, `src/stores/__tests__/catalogStore.test.ts`

**Interfaces:**
- Consumes: `parseSongsCsv` / `parsePerformancesCsv` / `parseVideosCsv`, `buildCatalog`, `Catalog`（Task 1）
- Produces:
  - `CATALOG_FILES: readonly ["app_songs_enriched.csv", "app_performances.csv", "app_videos.csv"]`
  - `catalogUrl(file: string): string`
  - `loadCatalog(fetchFn?: typeof fetch): Promise<Catalog>`
  - `useCatalogStore`（state: `status: "idle" | "loading" | "ready" | "error"`, `catalog: Catalog | null`, `error: Error | null`, action `load(fetchFn?: typeof fetch): Promise<void>`）
  - `requireCatalog(catalog: Catalog | null): Catalog`（null なら throw）
  - `useCatalog(): Catalog`（`requireCatalog` で ready 以外を throw）

- [ ] **Step 1: 取得の失敗テストを書く**

`src/data/__tests__/loadCatalog.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { CATALOG_FILES, catalogUrl, loadCatalog } from "../loadCatalog";

const CSV: Record<string, string> = {
  "app_songs_enriched.csv": "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n",
  "app_performances.csv":
    "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
    "perf_0001,song_0001,abc,0,300,2024-01-15T19:00:00Z\n",
  "app_videos.csv":
    "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
    "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,10,1\n",
};

/** URL末尾のファイル名で CSV を返す fetch。status を上書きしたいファイルを指定できる */
function fakeFetch(statusOverrides: Record<string, number> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const file = CATALOG_FILES.find((f) => url.endsWith(`/data/${f}`));
    if (!file) return new Response("not found", { status: 404 });
    return new Response(CSV[file], { status: statusOverrides[file] ?? 200 });
  });
}

describe("loadCatalog", () => {
  // #1 BASE_URL 配下の data/ を指す
  it("builds the URL under BASE_URL", () => {
    expect(catalogUrl("app_videos.csv")).toBe(`${import.meta.env.BASE_URL}data/app_videos.csv`);
  });

  // #2 3ファイルを no-cache で取得し Catalog を組み立てる
  it("fetches the three CSVs with no-cache and builds a catalog", async () => {
    const fetchFn = fakeFetch();
    const catalog = await loadCatalog(fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(3);
    for (const file of CATALOG_FILES) {
      expect(fetchFn).toHaveBeenCalledWith(catalogUrl(file), { cache: "no-cache" });
    }
    expect(catalog.songPerformances[0].title).toBe("天体観測");
    expect(catalog.streams[0].title).toBe("歌枠");
  });

  // #3 1つでも HTTP エラーなら reject（部分データで表示しない）
  it("rejects when any response is not ok", async () => {
    await expect(loadCatalog(fakeFetch({ "app_videos.csv": 404 }))).rejects.toThrow(/app_videos\.csv/);
  });

  // #4 ネットワーク例外も reject
  it("rejects when fetch throws", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(loadCatalog(fetchFn)).rejects.toThrow("Failed to fetch");
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run src/data/__tests__/loadCatalog.test.ts`
Expected: FAIL（`../loadCatalog` が解決できない）

- [ ] **Step 3: 取得を実装**

`src/data/loadCatalog.ts`:

```ts
import { buildCatalog } from "./buildCatalog";
import { parsePerformancesCsv, parseSongsCsv, parseVideosCsv } from "./parseCatalog";
import type { Catalog } from "./types";

export const CATALOG_FILES = [
  "app_songs_enriched.csv",
  "app_performances.csv",
  "app_videos.csv",
] as const;

export function catalogUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`;
}

// 既定は window の fetch。変数に代入したまま呼んでも this 不整合にならないよう包む
const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

async function fetchText(fetchFn: typeof fetch, file: string): Promise<string> {
  // no-cache: HTTPキャッシュがあっても必ずサーバーに再検証させ、古いCSVを掴まない
  const res = await fetchFn(catalogUrl(file), { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`${file} を取得できませんでした (HTTP ${res.status})`);
  }
  return res.text();
}

/** 曲データCSVを取得して Catalog を組み立てる。1つでも失敗したら reject */
export async function loadCatalog(fetchFn: typeof fetch = defaultFetch): Promise<Catalog> {
  const [songsCsv, performancesCsv, videosCsv] = await Promise.all(
    CATALOG_FILES.map((file) => fetchText(fetchFn, file))
  );
  return buildCatalog({
    songs: parseSongsCsv(songsCsv),
    performances: parsePerformancesCsv(performancesCsv),
    videos: parseVideosCsv(videosCsv),
  });
}
```

- [ ] **Step 4: 緑を確認**

Run: `npx vitest run src/data/__tests__/loadCatalog.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: ストアの失敗テストを書く**

`src/stores/__tests__/catalogStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCatalogStore, useCatalog, requireCatalog } from "../catalogStore";
import { testCatalog } from "../../test/catalogFixture";
import { CATALOG_FILES } from "../../data/loadCatalog";

const CSV: Record<string, string> = {
  "app_songs_enriched.csv": "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n",
  "app_performances.csv":
    "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
    "perf_0001,song_0001,abc,0,300,2024-01-15T19:00:00Z\n",
  "app_videos.csv":
    "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
    "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,10,1\n",
};

const okFetch = vi.fn(async (input: RequestInfo | URL) => {
  const file = CATALOG_FILES.find((f) => String(input).endsWith(f));
  return new Response(file ? CSV[file] : "", { status: file ? 200 : 404 });
});

const failingFetch = vi.fn(async () => {
  throw new TypeError("Failed to fetch");
});

describe("catalogStore", () => {
  beforeEach(() => {
    // setup.ts は全テストで ready に初期化するため、ここでは未開始へ戻す
    useCatalogStore.setState({ status: "idle", catalog: null, error: null });
  });

  // #1 load 中は loading
  it("is loading while the catalog is being fetched", () => {
    const pending = useCatalogStore.getState().load(okFetch);
    expect(useCatalogStore.getState().status).toBe("loading");
    return pending;
  });

  // #2 成功で ready と catalog
  it("becomes ready with the loaded catalog", async () => {
    await useCatalogStore.getState().load(okFetch);
    const state = useCatalogStore.getState();
    expect(state.status).toBe("ready");
    expect(state.catalog?.songPerformances[0].title).toBe("天体観測");
    expect(state.error).toBeNull();
  });

  // #3 失敗で error
  it("becomes error when loading fails", async () => {
    await useCatalogStore.getState().load(failingFetch);
    const state = useCatalogStore.getState();
    expect(state.status).toBe("error");
    expect(state.catalog).toBeNull();
    expect(state.error?.message).toBe("Failed to fetch");
  });

  // #4 error から再試行で ready
  it("recovers on retry after an error", async () => {
    await useCatalogStore.getState().load(failingFetch);
    await useCatalogStore.getState().load(okFetch);
    expect(useCatalogStore.getState().status).toBe("ready");
  });
});

describe("useCatalog", () => {
  // #5 ready なら catalog を返す
  it("returns the catalog when ready", () => {
    useCatalogStore.setState({ status: "ready", catalog: testCatalog, error: null });
    const { result } = renderHook(() => useCatalog());
    expect(result.current).toBe(testCatalog);
  });

  // #6 ready 以外で使うのは契約違反なので throw
  // （描画中の例外の伝わり方は React のバージョンで変わるため、判定部分を純関数で検証する）
  it("requireCatalog throws when the catalog is not loaded", () => {
    expect(() => requireCatalog(null)).toThrow(/CatalogGate/);
    expect(requireCatalog(testCatalog)).toBe(testCatalog);
  });
});
```

- [ ] **Step 6: 失敗を確認**

Run: `npx vitest run src/stores/__tests__/catalogStore.test.ts`
Expected: FAIL（`../catalogStore` が解決できない）

- [ ] **Step 7: ストアを実装**

`src/stores/catalogStore.ts`:

```ts
import { create } from "zustand";
import { loadCatalog } from "../data/loadCatalog";
import type { Catalog } from "../data/types";

type CatalogState =
  | { status: "idle"; catalog: null; error: null }
  | { status: "loading"; catalog: null; error: null }
  | { status: "ready"; catalog: Catalog; error: null }
  | { status: "error"; catalog: null; error: Error };

type CatalogStore = CatalogState & {
  /** 曲データを取得する。失敗しても throw せず status=error にする */
  load: (fetchFn?: typeof fetch) => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>()((set) => ({
  status: "idle",
  catalog: null,
  error: null,
  load: async (fetchFn) => {
    set({ status: "loading", catalog: null, error: null });
    try {
      const catalog = await loadCatalog(fetchFn);
      set({ status: "ready", catalog, error: null });
    } catch (e) {
      set({
        status: "error",
        catalog: null,
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
  },
}));

/** 読み込み済みでなければ throw（CatalogGate 配下でのみ使う契約を実行時にも守る） */
export function requireCatalog(catalog: Catalog | null): Catalog {
  if (!catalog) {
    throw new Error("useCatalog は CatalogGate の配下で使ってください");
  }
  return catalog;
}

/** 曲データ。CatalogGate の配下（＝読み込み完了後）でのみ使う */
export function useCatalog(): Catalog {
  return requireCatalog(useCatalogStore((s) => s.catalog));
}
```

`fetchFn` が `undefined` のとき `loadCatalog(undefined)` は既定引数が効く。

- [ ] **Step 8: 緑と型を確認**

Run: `npx vitest run src/stores/__tests__/catalogStore.test.ts && npx tsc -b`
Expected: PASS（6件）/ 型エラーなし

- [ ] **Step 9: コミット**

```bash
git add src/data/loadCatalog.ts src/stores/catalogStore.ts src/data/__tests__/loadCatalog.test.ts src/stores/__tests__/catalogStore.test.ts
git commit -m "feat: 曲データCSVを取得するloadCatalogとcatalogStoreを追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: CatalogGate とテスト共通初期化

**Files:**
- Create: `src/components/layout/CatalogGate.tsx`
- Modify: `src/test/setup.ts`
- Test: `src/components/__tests__/CatalogGate.test.tsx`

**Interfaces:**
- Consumes: `useCatalogStore`（Task 2）、`testCatalog`（Task 1）
- Produces: `default function CatalogGate({ children }: { children: ReactNode }): JSX.Element`。setup.ts により全テストは `catalogStore` が `ready(testCatalog)` の状態で始まる

- [ ] **Step 1: setup.ts で全テストを ready 状態から始める**

`src/test/setup.ts` の先頭 import 群に追加し、末尾に `beforeEach` を追加:

```ts
import { afterEach, beforeEach } from "vitest";
import { useCatalogStore } from "../stores/catalogStore";
import { testCatalog } from "./catalogFixture";
```

（既存の `import { afterEach } from "vitest";` は上の行に置き換える）

```ts
// 画面は CatalogGate 配下で読み込み完了後に描画される。各テストは
// 「読み込み済み」から始め、ゲート自体のテストだけ個別に状態を上書きする。
// load はゲートのテストで差し替えるため、毎回本物に戻す。
const realLoad = useCatalogStore.getState().load;
beforeEach(() => {
  useCatalogStore.setState({
    status: "ready",
    catalog: testCatalog,
    error: null,
    load: realLoad,
  });
});
```

- [ ] **Step 2: 全テストが従来どおり緑であることを確認（setup 変更の安全確認）**

Run: `npm run test`
Expected: PASS（Task 0 の件数 + Task 1/2 の追加分）

- [ ] **Step 3: ゲートの失敗テストを書く**

`src/components/__tests__/CatalogGate.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import CatalogGate from "../layout/CatalogGate";
import { useCatalogStore } from "../../stores/catalogStore";

function renderGate() {
  return renderWithProviders(
    <CatalogGate>
      <p>曲一覧</p>
    </CatalogGate>
  );
}

describe("CatalogGate", () => {
  // #1 未開始なら1回だけ読み込みを始め、読み込み中を表示
  it("starts loading once when idle and shows a progress indicator", () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "idle", catalog: null, error: null, load });
    renderGate();
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("曲一覧")).toBeNull();
  });

  // #2 読み込み中は重ねて load しない
  it("does not start another load while loading", () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "loading", catalog: null, error: null, load });
    renderGate();
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  // #3 失敗時はメッセージと再試行
  it("shows an error with a retry button that reloads", async () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "error", catalog: null, error: new Error("x"), load });
    renderGate();
    expect(screen.getByText("曲データを読み込めませんでした")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  // #4 読み込み完了で子を描画
  it("renders children when ready", () => {
    renderGate(); // setup.ts で ready(testCatalog)
    expect(screen.getByText("曲一覧")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
```

- [ ] **Step 4: 失敗を確認**

Run: `npx vitest run src/components/__tests__/CatalogGate.test.tsx`
Expected: FAIL（`../layout/CatalogGate` が解決できない）

- [ ] **Step 5: ゲートを実装**

`src/components/layout/CatalogGate.tsx`:

```tsx
import { useEffect } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useCatalogStore } from "../../stores/catalogStore";

const centerSx = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  px: 2,
} as const;

/** 曲データの読み込みが終わるまで画面を出さず、失敗時は再試行を促す */
export default function CatalogGate({ children }: { children: ReactNode }) {
  const status = useCatalogStore((s) => s.status);
  const load = useCatalogStore((s) => s.load);

  useEffect(() => {
    // StrictMode の二重実行でも、2回目は loading になっているので取得は1回だけ
    if (useCatalogStore.getState().status === "idle") {
      void load();
    }
  }, [load]);

  if (status === "ready") return <>{children}</>;

  if (status === "error") {
    return (
      <Box sx={centerSx}>
        <Typography>曲データを読み込めませんでした</Typography>
        <Button variant="outlined" onClick={() => void load()}>
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={centerSx}>
      <CircularProgress aria-label="曲データを読み込み中" />
    </Box>
  );
}
```

- [ ] **Step 6: 緑を確認**

Run: `npx vitest run src/components/__tests__/CatalogGate.test.tsx && npm run test`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/components/layout/CatalogGate.tsx src/components/__tests__/CatalogGate.test.tsx src/test/setup.ts
git commit -m "feat: 曲データ読み込みを出し分けるCatalogGateを追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 起動時取得への切り替え（利用側・ビルド設定・旧データ層の削除）

**Files:**
- Modify: `vite.config.ts`（`csvDataPlugin` → `catalogCsvPlugin`）
- Modify: `vitest.config.ts`（virtual alias 削除）
- Modify: `src/vite-env.d.ts`（virtual 宣言削除）
- Modify: `src/App.tsx`（`CatalogGate` で包む）
- Modify: `src/data/calendar.ts`（モジュール値削除、`latestStreamDateInMonth` 引数化）
- Modify: `src/pages/HomePage.tsx`, `src/pages/LibraryPage.tsx`, `src/pages/PlaylistPage.tsx`, `src/pages/CalendarPage.tsx`, `src/components/home/PlaylistTile.tsx`, `src/hooks/useFilteredSongs.ts`, `src/hooks/useRecentSongs.ts`
- Modify tests: `src/data/__tests__/calendar.test.ts`, `src/components/__tests__/{App,HomePage,PlayerBody,PlaylistTile,SongList.viewMode}.test.tsx`, `src/hooks/__tests__/useFilteredSongs.test.ts`
- Delete: `src/data/songs.ts`, `src/data/__tests__/songs.test.ts`, `src/test/__mocks__/virtualSongs.ts`, `src/test/__mocks__/virtualPerformances.ts`, `src/test/__mocks__/virtualVideos.ts`

**Interfaces:**
- Consumes: `useCatalog()`（Task 2）、`CatalogGate`（Task 3）、`testCatalog`（Task 1）
- Produces: `latestStreamDateInMonth(monthKey: string, streamDateKeys: string[]): string | null`。dev で `GET /setlist-player/data/<file>.csv`、build で `dist/data/<file>.csv`

- [ ] **Step 1: カレンダーの失敗テストに書き換える**

`src/data/__tests__/calendar.test.ts` の import を次に変更:

```ts
import { describe, it, expect } from "vitest";
import {
  groupStreamsByJstDate,
  monthRange,
  buildMonthWeeks,
  latestStreamDateInMonth,
} from "../calendar";
import { makeStream } from "../../test/fixtures";
```

末尾の `describe("calendarMonths / streamsByDate / latestStreamDateInMonth (実データ)", ...)` ブロック全体を次に置き換える（#11/#12 は Task 1 の `buildCatalog.test.ts` #8/#9 へ移植済み）:

```ts
describe("latestStreamDateInMonth", () => {
  // 渡した配信日だけを見ること（モジュール内の実データに依存しない）を確かめるため、
  // フィクスチャに無い年月を使う
  const dateKeys = ["2025-05-01", "2025-05-20", "2025-07-03"];

  // #11 その月の最新配信日（5月は 01 と 20 がある）
  it("returns the most recent stream date of a month", () => {
    expect(latestStreamDateInMonth("2025-05", dateKeys)).toBe("2025-05-20");
  });

  // #12 配信のない月は null
  it("returns null for a month without streams", () => {
    expect(latestStreamDateInMonth("2025-06", dateKeys)).toBeNull();
  });
});
```

Run: `npx vitest run src/data/__tests__/calendar.test.ts`
Expected: FAIL（現実装は第2引数を無視しフィクスチャの配信日を見るため、#11 が `null` を返す）

- [ ] **Step 2: calendar.ts を純関数だけにする**

`src/data/calendar.ts`:
- 1行目 `import { streams } from "./songs";` を削除
- `import { splitMonthKey, toJstDateKey, toMonthKey } from "./jstDate";` を `import { splitMonthKey, toJstDateKey } from "./jstDate";` にする（`toMonthKey` は削除する `calendarMonths` でしか使っていない。`buildCatalog.ts` が自前で import 済み）
- `export const streamsByDate`, `const streamDateKeys`, `export const calendarMonths` の3つを削除
- `latestStreamDateInMonth` を次に置き換え:

```ts
/** その月で最も新しい配信日（配信がなければ null）。streamDateKeys は昇順 */
export function latestStreamDateInMonth(
  monthKey: string,
  streamDateKeys: string[]
): string | null {
  for (let index = streamDateKeys.length - 1; index >= 0; index--) {
    if (streamDateKeys[index].startsWith(monthKey)) return streamDateKeys[index];
  }
  return null;
}
```

- [ ] **Step 3: 利用側を `useCatalog()` に置き換える**

`src/pages/CalendarPage.tsx`:

```tsx
import { latestStreamDateInMonth } from "../data/calendar";
import { useCatalog } from "../stores/catalogStore";
```

（`calendarMonths` / `streamsByDate` の import を上に置き換え）関数先頭に:

```tsx
export default function CalendarPage() {
  const { calendarMonths, streamsByDate, streamDateKeys } = useCatalog();
  const [monthIndex, setMonthIndex] = useState(calendarMonths.length - 1);
```

`latestStreamDateInMonth(monthKey)` を `latestStreamDateInMonth(monthKey, streamDateKeys)` に変更。

`src/pages/HomePage.tsx`: `import { songPerformances, streams } from "../data/songs";` を `import { useCatalog } from "../stores/catalogStore";` に置き換え、`HomePage()` の先頭行に `const { songPerformances, streams } = useCatalog();` を追加。`sortedSongs` の `useMemo` 依存配列を `[songPerformances, sortOption, selectedTags]` にする。

`src/pages/LibraryPage.tsx`: `import { songPerformances, songPerformanceById } from "../data/songs";` を `import { useCatalog } from "../stores/catalogStore";` に置き換え、コンポーネント先頭に `const { songPerformances, songPerformanceById } = useCatalog();`。`favorites` の依存配列を `[songPerformances, favoriteIds]`、`historySongs` を `[songPerformanceById, history]` にする。`as typeof songPerformances` は `useCatalog` 由来の同じ型（`SongPerformance[]`）なのでそのまま型が通る。可能なら型ガード `.filter((s): s is SongPerformance => s !== undefined)` に置き換え、`SongPerformance` を `../data/types` から import する（`as` を減らす）。

`src/pages/PlaylistPage.tsx`: import を `useCatalog` に置き換え、先頭に `const { songPerformanceById } = useCatalog();`、`songs` の依存配列を `[songPerformanceById, playlist]`。

`src/components/home/PlaylistTile.tsx`: `import { songPerformanceById } from "../../data/songs";` を `import { useCatalog } from "../../stores/catalogStore";` に置き換え、`const navigate = useNavigate();` の次に `const { songPerformanceById } = useCatalog();`。

`src/hooks/useFilteredSongs.ts`:

```ts
import { useMemo } from "react";
import { useCatalog } from "../stores/catalogStore";
import { useLibraryStore } from "../stores/libraryStore";
import type { SongPerformance } from "../data/types";

export function useFilteredSongs(): SongPerformance[] {
  const { songPerformances } = useCatalog();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  return useMemo(() => {
    if (!searchQuery.trim()) return songPerformances;

    const q = searchQuery.toLowerCase();
    return songPerformances.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [songPerformances, searchQuery]);
}
```

`src/hooks/useRecentSongs.ts`: import を `useCatalog` に置き換え、`const { songPerformanceById } = useCatalog();` を先頭に、依存配列を `[songPerformanceById, history, limit]`。

- [ ] **Step 4: App を CatalogGate で包む**

`src/App.tsx`: `import CatalogGate from "./components/layout/CatalogGate";` を追加し、

```tsx
function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CatalogGate>
        <AppContent />
      </CatalogGate>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: テストの参照をフィクスチャへ移す**

次のファイルの `import { ... } from "../../data/songs";` を `import { testCatalog } from "../../test/catalogFixture";` に置き換え、本文の `songPerformances` → `testCatalog.songPerformances`、`streams` → `testCatalog.streams` に置換する:
`src/components/__tests__/App.test.tsx`, `HomePage.test.tsx`, `PlayerBody.test.tsx`, `PlaylistTile.test.tsx`, `SongList.viewMode.test.tsx`, `src/hooks/__tests__/useFilteredSongs.test.ts`

置換後、各ファイルで `songPerformances` / `streams` の裸の参照が残っていないことを確認:

Run: `grep -nE "\b(songPerformances|streams)\b" src/components/__tests__/App.test.tsx src/components/__tests__/HomePage.test.tsx src/components/__tests__/PlayerBody.test.tsx src/components/__tests__/PlaylistTile.test.tsx src/components/__tests__/SongList.viewMode.test.tsx src/hooks/__tests__/useFilteredSongs.test.ts | grep -v "testCatalog\."`
Expected: 出力なし（あれば `testCatalog.` を付け忘れた参照。プロパティ名など別物なら目視で除外）

- [ ] **Step 6: 旧データ層と仮想モジュールを削除**

```bash
git rm src/data/songs.ts src/data/__tests__/songs.test.ts src/test/__mocks__/virtualSongs.ts src/test/__mocks__/virtualPerformances.ts src/test/__mocks__/virtualVideos.ts
```

`src/vite-env.d.ts` を次の1行だけにする:

```ts
/// <reference types="vite/client" />
```

`vitest.config.ts` から `mocksDir` 定数と `resolve.alias` の3行（`virtual:*`）を削除する（`resolve` ブロックごと削除。`path` import が未使用になれば削除）。

- [ ] **Step 7: Vite プラグインを CSV 配信・出力に置き換える**

`vite.config.ts` 全体を次にする（`RawSong` 等の型と papaparse は `parseCatalog.ts` に移ったので不要）:

```ts
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");

/** アプリが起動時に取得する曲データ（src/data/loadCatalog.ts の CATALOG_FILES と一致させる） */
const CATALOG_FILES = [
  "app_songs_enriched.csv",
  "app_performances.csv",
  "app_videos.csv",
];

/**
 * 曲データCSVを `${base}data/` で配る。
 * dev: リポジトリの data/ をそのまま返す / build: dist/data/ に出力する。
 */
function catalogCsvPlugin(): Plugin {
  let base = "/";
  return {
    name: "catalog-csv",
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0];
        const file = CATALOG_FILES.find((f) => pathname === `${base}data/${f}`);
        if (!file) return next();
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(fs.readFileSync(path.join(dataDir, file)));
      });
    },
    generateBundle() {
      for (const file of CATALOG_FILES) {
        this.emitFile({
          type: "asset",
          fileName: `data/${file}`,
          source: fs.readFileSync(path.join(dataDir, file)),
        });
      }
    },
  };
}

export default defineConfig({
  base: "/setlist-player/",
  plugins: [react(), catalogCsvPlugin()],
});
```

- [ ] **Step 8: 全テスト・型・lint・ビルドを確認**

Run: `npm run test && npm run lint && npm run build`
Expected: すべて成功

Run: `ls dist/data && grep -c "天体観測" dist/assets/*.js`
Expected: `app_performances.csv app_songs_enriched.csv app_videos.csv` が出る。JS バンドルに曲名が埋め込まれていない（各ファイル 0。曲データが JS から CSV に移ったことの確認）

- [ ] **Step 9: dev サーバーで実際に取得できることを確認**

`app/.claude/launch.json` の `setlist-player-dev`（ポート 5176）を `preview_start` で起動し、`http://localhost:5176/setlist-player/` を開く。
確認: 読み込み表示の後にホームの曲一覧が出る / `read_network_requests` で `data/app_*.csv` 3件が 200 / `read_console_messages` にエラーがない。
加えて `http://localhost:5176/setlist-player/data/app_videos.csv` を直接開き、CSV テキストが返る（index.html でない）こと。

- [ ] **Step 10: コミット**

```bash
git add -A src vite.config.ts vitest.config.ts
git commit -m "feat: 曲データをビルド時埋め込みから起動時のCSV取得に切り替え

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: ストレージ永続化の要求

**Files:**
- Create: `src/stores/requestPersistentStorage.ts`
- Modify: `src/main.tsx`
- Test: `src/stores/__tests__/requestPersistentStorage.test.ts`

**Interfaces:**
- Produces: `requestPersistentStorage(storage?: Pick<StorageManager, "persist" | "persisted">): Promise<void>`

- [ ] **Step 1: 失敗テストを書く**

`src/stores/__tests__/requestPersistentStorage.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { requestPersistentStorage } from "../requestPersistentStorage";

describe("requestPersistentStorage", () => {
  // #1 まだ永続化されていなければ要求する
  it("requests persistence when not yet persisted", async () => {
    const storage = { persisted: vi.fn(async () => false), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage);
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  // #2 既に永続化済みなら何もしない（ブラウザによっては毎回確認を出すため）
  it("does nothing when already persisted", async () => {
    const storage = { persisted: vi.fn(async () => true), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage);
    expect(storage.persist).not.toHaveBeenCalled();
  });

  // #3 未対応ブラウザ（navigator.storage なし）でも例外にしない
  it("does nothing when the Storage API is unavailable", async () => {
    await expect(requestPersistentStorage(undefined)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npx vitest run src/stores/__tests__/requestPersistentStorage.test.ts`
Expected: FAIL（モジュールが解決できない）

- [ ] **Step 3: 実装**

`src/stores/requestPersistentStorage.ts`:

```ts
type PersistableStorage = Pick<StorageManager, "persist" | "persisted">;

/**
 * お気に入り・プレイリスト等（localStorage）をブラウザの自動削除から守るよう要求する。
 * 結果は画面に出さない。未対応ブラウザでは何もしない。
 */
export async function requestPersistentStorage(
  storage: PersistableStorage | undefined = globalThis.navigator?.storage
): Promise<void> {
  if (!storage?.persist || !storage.persisted) return;
  if (await storage.persisted()) return;
  await storage.persist();
}
```

- [ ] **Step 4: 緑を確認**

Run: `npx vitest run src/stores/__tests__/requestPersistentStorage.test.ts`
Expected: PASS（3件）

- [ ] **Step 5: 起動時に呼ぶ**

`src/main.tsx` の import に `import { requestPersistentStorage } from "./stores/requestPersistentStorage";` を追加し、`createRoot(...)` の前に:

```tsx
void requestPersistentStorage();
```

- [ ] **Step 6: 型・lint を確認してコミット**

Run: `npx tsc -b && npm run lint`
Expected: 成功

```bash
git add src/stores/requestPersistentStorage.ts src/stores/__tests__/requestPersistentStorage.test.ts src/main.tsx
git commit -m "feat: 起動時にストレージ永続化を要求しユーザーデータの自動削除を防ぐ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: PWA 化（マニフェスト・アイコン・Service Worker・更新通知）

**Files:**
- Modify: `package.json` / `package-lock.json`（devDependencies 追加）
- Create: `public/icon.svg` と生成 PNG/ICO（`public/` 直下）
- Modify: `vite.config.ts`（`VitePWA` 追加）
- Modify: `vitest.config.ts`（`virtual:pwa-register/react` の alias）
- Modify: `src/vite-env.d.ts`（PWA 型参照）
- Modify: `index.html`（アイコン・theme-color）
- Create: `src/test/__mocks__/pwaRegisterReact.ts`
- Create: `src/components/layout/UpdatePrompt.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/__tests__/UpdatePrompt.test.tsx`

**Interfaces:**
- Consumes: なし（`App` に差し込むだけ）
- Produces: `default function UpdatePrompt(): JSX.Element`

- [ ] **Step 1: 依存を追加**

Run: `npm install -D vite-plugin-pwa@^2 workbox-build@^7.4.1 workbox-window@^7.4.1 @vite-pwa/assets-generator@^1`
Expected: 成功。`npm ls vite-plugin-pwa` で 2.x

（`@vite-pwa/assets-generator` は peer が `^1.0.0 || ^2.0.0`。`npm view @vite-pwa/assets-generator version` が 2.x なら `@^2` を使う）

- [ ] **Step 2: アイコンの元 SVG を作り、PNG を生成**

`public/icon.svg`（暗い背景＋テーマの primary 色の音符。差し替え前提の簡素なもの）:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#121212"/>
  <g fill="#90caf9">
    <path d="M336 96v226a64 64 0 1 1-32-55.4V160l-112 28v166a64 64 0 1 1-32-55.4V164z"/>
  </g>
</svg>
```

Run: `npx pwa-assets-generator --preset minimal-2023 public/icon.svg`
Expected: `public/` に `favicon.ico`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` が生成される。ファイル名が異なる場合は以降の参照を実ファイル名に合わせる。

Read ツールで `public/pwa-512x512.png` と `public/maskable-icon-512x512.png` を開き、音符が切れずに見えることを目視確認。

- [ ] **Step 3: 更新通知の失敗テストを書く**

`src/test/__mocks__/pwaRegisterReact.ts`（Vitest は PWA プラグインを読まないため、仮想モジュールをこのスタブに向ける）:

```ts
import { vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";

const noop: Dispatch<SetStateAction<boolean>> = () => {};

/** 既定は「更新なし」。テストで mockReturnValue して状態を作る */
export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, noop] as [boolean, Dispatch<SetStateAction<boolean>>],
  offlineReady: [false, noop] as [boolean, Dispatch<SetStateAction<boolean>>],
  updateServiceWorker: vi.fn(async (_reloadPage?: boolean) => {}),
}));
```

注: `as [boolean, ...]` はタプル型の明示で、型を黙らせる用途ではない。lint が `_reloadPage` の未使用を指摘する場合は引数を省いて `vi.fn(async () => {})` にする。

`vitest.config.ts` に `resolve.alias` を追加（Task 4 で消したブロックを PWA 用に再作成）:

```ts
const mocksDir = path.resolve(__dirname, "src/test/__mocks__");
// ...
  resolve: {
    alias: {
      "virtual:pwa-register/react": path.join(mocksDir, "pwaRegisterReact.ts"),
    },
  },
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

`src/components/__tests__/UpdatePrompt.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import UpdatePrompt from "../layout/UpdatePrompt";

const noop: Dispatch<SetStateAction<boolean>> = () => {};

function mockRegisterSW(needRefresh: boolean) {
  const updateServiceWorker = vi.fn(async () => {});
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [needRefresh, noop],
    offlineReady: [false, noop],
    updateServiceWorker,
  });
  return updateServiceWorker;
}

describe("UpdatePrompt", () => {
  // #1 新しい版が無ければ何も出さない
  it("shows nothing when no update is waiting", () => {
    mockRegisterSW(false);
    renderWithProviders(<UpdatePrompt />);
    expect(screen.queryByText("新しいバージョンがあります")).toBeNull();
  });

  // #2 待機中の新しい版があれば知らせる
  it("announces a waiting update", () => {
    mockRegisterSW(true);
    renderWithProviders(<UpdatePrompt />);
    expect(screen.getByText("新しいバージョンがあります")).toBeInTheDocument();
  });

  // #3 「更新」で新しい版に切り替えて再読み込み
  it("applies the update and reloads when 更新 is pressed", async () => {
    const updateServiceWorker = mockRegisterSW(true);
    renderWithProviders(<UpdatePrompt />);
    await userEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 4: 失敗を確認**

Run: `npx vitest run src/components/__tests__/UpdatePrompt.test.tsx`
Expected: FAIL（`../layout/UpdatePrompt` が解決できない）

- [ ] **Step 5: 更新通知を実装**

`src/components/layout/UpdatePrompt.tsx`:

```tsx
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * 新しい版の Service Worker が待機中なら知らせる。
 * 再生を中断しないよう自動では切り替えず、「更新」を押したときだけ再読み込みする。
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      message="新しいバージョンがあります"
      action={
        <Button color="primary" size="small" onClick={() => void updateServiceWorker(true)}>
          更新
        </Button>
      }
    />
  );
}
```

（上部表示: 下部の MiniPlayer / BottomNav と重ならないように）

- [ ] **Step 6: 緑を確認**

Run: `npx vitest run src/components/__tests__/UpdatePrompt.test.tsx`
Expected: PASS（3件）

- [ ] **Step 7: App に差し込む**

`src/App.tsx` に `import UpdatePrompt from "./components/layout/UpdatePrompt";` を追加し、データ読み込みに失敗していても更新は適用できるよう `CatalogGate` の外に置く:

```tsx
function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CatalogGate>
        <AppContent />
      </CatalogGate>
      <UpdatePrompt />
    </BrowserRouter>
  );
}
```

- [ ] **Step 8: VitePWA を設定**

`vite.config.ts` に `import { VitePWA } from "vite-plugin-pwa";` を追加し、`plugins` を次にする:

```ts
  plugins: [
    react(),
    catalogCsvPlugin(),
    VitePWA({
      // 更新は UpdatePrompt で利用者に委ねる（再生中に勝手に再読み込みしない）
      registerType: "prompt",
      // 登録は UpdatePrompt の useRegisterSW が行う
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "icon.svg"],
      manifest: {
        name: "セトリプレイヤー",
        short_name: "セトリプレイヤー",
        description: "配信アーカイブの歌をブラウズ・再生するプレイヤー",
        lang: "ja",
        start_url: "/setlist-player/",
        scope: "/setlist-player/",
        display: "standalone",
        theme_color: "#121212",
        background_color: "#121212",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // アプリ本体のみ precache。CSV は含めない（precache はリビジョン固定で下の NetworkFirst より優先されるため）
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["404.html"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/\/data\//],
        // 配信者の権利保護: ランタイムキャッシュは同一オリジンの曲データCSVだけ。
        // YouTube（埋め込み・サムネイル・IFrame API）はルートを持たない＝一切キャッシュしない。
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/data\/[^/]+\.csv$/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "catalog-csv",
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
```

- [ ] **Step 9: index.html にアイコンと theme-color を追加**

`index.html` の `<title>` の直前に:

```html
    <meta name="theme-color" content="#121212" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

（Vite が build 時に `public/` 参照へ base を付与する）

- [ ] **Step 10: 全テスト・lint・ビルドと成果物を確認**

Run: `npm run test && npm run lint && npm run build`
Expected: すべて成功

Run: `ls dist && cat dist/manifest.webmanifest && grep -o 'catalog-csv' dist/sw.js | head -1 && grep -c 'youtube' dist/sw.js`
Expected: `sw.js`, `manifest.webmanifest`, `data/` が存在 / マニフェストに `start_url: "/setlist-player/"` / `catalog-csv` を含む / `sw.js` に `youtube` が 0 件

Run: `grep -o '"url":"[^"]*"' dist/sw.js | head -40`（precache 一覧）
Expected: `data/*.csv` と `404.html` が含まれない

- [ ] **Step 11: コミット**

```bash
git add package.json package-lock.json public vite.config.ts vitest.config.ts index.html src/vite-env.d.ts src/test/__mocks__/pwaRegisterReact.ts src/components/layout/UpdatePrompt.tsx src/components/__tests__/UpdatePrompt.test.tsx src/App.tsx
git commit -m "feat: PWA化（マニフェスト・Service Worker・更新通知）

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 実機相当の動作確認と E2E

**Files:**
- Modify: `app/.claude/launch.json`（preview 構成を追加。未追跡ファイルのためコミット対象外）

- [ ] **Step 1: preview 構成を追加**

`app/.claude/launch.json` の `configurations` に追加:

```json
    {
      "name": "setlist-player-preview",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "preview", "--", "--port", "4176", "--strictPort"],
      "port": 4176
    }
```

- [ ] **Step 2: ビルド成果物をブラウザで確認**

`npm run build` 後、`preview_start` で `setlist-player-preview` を起動し `http://localhost:4176/setlist-player/` を開く。`javascript_tool` で確認:

```js
const reg = await navigator.serviceWorker.ready;
({ scope: reg.scope, active: !!reg.active, manifest: document.querySelector('link[rel="manifest"]')?.href })
```
Expected: scope が `/setlist-player/`、active true、manifest リンクあり

一度ページを再読込（SW 制御下で CSV がキャッシュされる）してから:

```js
const out = {};
for (const name of await caches.keys()) {
  out[name] = (await (await caches.open(name)).keys()).map((r) => r.url);
}
out
```
Expected: `catalog-csv` に `data/app_*.csv` 3件 / precache にアプリ本体 / **どのキャッシュにも `youtube.com` / `ytimg` / `img.youtube.com` の URL がない**

- [ ] **Step 3: オフライン起動を確認**

曲を1つ再生してから（YouTube 通信が発生しても SW がキャッシュしないことの確認を兼ねる）、Step 2 のキャッシュ一覧を再取得して YouTube URL が無いことを再確認。

`preview_stop` でサーバーを止め、同じタブを `/setlist-player/` と `/setlist-player/library` で再読込。
Expected: どちらもアプリが起動し曲一覧が表示される（`navigateFallback` が base 付きで効いていること）。もし `/setlist-player/library` が失敗する場合は `navigateFallback` を `/setlist-player/index.html` にして Task 6 Step 10 から再確認する。

- [ ] **Step 4: 更新通知を確認**

`src/components/layout/UpdatePrompt.tsx` 等に影響しない無害な変更（例: `vite.config.ts` の `manifest.description` の文言を一時変更）で再ビルド → preview 再起動 → 既存タブを再読込。
Expected: 「新しいバージョンがあります」が上部に出て、「更新」で再読込される。確認後、一時変更は `git checkout -- vite.config.ts` で戻す。

- [ ] **Step 5: E2E を実行し Task 0 のベースラインと比較**

Run: `npx playwright test --reporter=line 2>&1 | tail -30`
Expected: Task 0 で記録した失敗以外に新しい失敗がない。新規の失敗があれば superpowers:systematic-debugging で原因を特定して修正（テストを緩めない）。

---

### Task 8: ドキュメントとバージョン

**Files:**
- Modify: `../CLAUDE.md`, `../data/README.md`
- Modify: `package.json`, `package-lock.json`（version）

- [ ] **Step 1: CLAUDE.md を更新**

「### データパイプライン」の箇条書き先頭3行を次に置き換える:

```markdown
CSVファイル → Viteプラグイン（dev配信 / build時に `dist/data/` へ出力） → 起動時に取得 → `catalogStore` → アプリ

- `vite.config.ts` の `catalogCsvPlugin` が `app_songs_enriched.csv`, `app_performances.csv`, `app_videos.csv` を `${base}data/` で配る（dev はリポジトリの `data/` を直接返す）
- 起動時に `CatalogGate` が `catalogStore.load()` → `src/data/loadCatalog.ts`（取得）→ `parseCatalog.ts`（パース）→ `buildCatalog.ts`（結合・集計）。画面は `useCatalog()` で同期的に読む（`CatalogGate` 配下専用）
- テストは `src/test/setup.ts` が全テストの前に `catalogStore` を `src/test/catalogFixture.ts` の `testCatalog` で ready にする
```

「### 状態管理 (Zustand v5)」の「6つのストア」を「7つのストア」とし、表に行を追加:

```markdown
| `catalogStore` | (非永続) | 起動時に取得した曲データ（idle/loading/ready/error） |
```

「## Architecture」の末尾に節を追加:

```markdown
### PWA

`vite-plugin-pwa`（generateSW, `registerType: "prompt"`）。アプリ本体を precache し、`data/*.csv` のみ NetworkFirst（5秒でキャッシュへフォールバック、キャッシュ名 `catalog-csv`）。**YouTube 由来（埋め込み・サムネイル・IFrame API）はキャッシュしない**（配信者の権利保護）。新版は `UpdatePrompt` の「更新」で適用し自動リロードしない。起動時に `requestPersistentStorage()` で永続化を要求。dev では SW は無効。
```

- [ ] **Step 2: data/README.md の該当文を更新**

`アプリ（`app/`）が `vite.config.ts` の `csvDataPlugin` 経由で読み込むファイル群。` を次に置き換え:

```markdown
アプリ（`app/`）が起動時に取得するファイル群。デプロイ時に `vite.config.ts` の `catalogCsvPlugin` がサイトの `data/` に配置する。
```

- [ ] **Step 3: バージョンを 1.3.0 に**

`package.json` の `"version": "1.2.2"` → `"1.3.0"`。`package-lock.json` の先頭2箇所（root の `"version"` と `packages[""].version`）も `1.3.0`。

Run: `grep -n '"version"' package.json && sed -n 1,12p package-lock.json`
Expected: 3箇所とも `1.3.0`

- [ ] **Step 4: 最終検証**

Run: `npm run test && npm run lint && npm run build`
Expected: すべて成功

- [ ] **Step 5: コミット**

```bash
git add ../CLAUDE.md ../data/README.md package.json package-lock.json
git commit -m "docs: 起動時CSV取得とPWAをCLAUDE.mdに反映し、バージョンを1.3.0に更新

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
