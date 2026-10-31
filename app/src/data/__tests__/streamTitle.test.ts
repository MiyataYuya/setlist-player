import { describe, it, expect } from "vitest";
import { cleanStreamTitle } from "../streamTitle";

describe("cleanStreamTitle", () => {
  // #1 【...】を除去
  it("removes bracketed prefixes", () => {
    expect(cleanStreamTitle("【歌枠】新年歌配信！")).toBe("新年歌配信！");
  });

  // #2 チャンネル名サフィックスを除去
  it("removes the channel-name suffix", () => {
    expect(cleanStreamTitle("歌配信 - ミナミイズミ ch")).toBe("歌配信");
  });

  // #3 "singing stream" 以降を除去（大小無視）
  it("removes the singing stream suffix regardless of case", () => {
    expect(cleanStreamTitle("弾き語り Singing Stream #vtuber")).toBe("弾き語り");
  });

  // #4 ハッシュタグを除去
  it("removes hashtags", () => {
    expect(cleanStreamTitle("春の歌配信 #歌枠 #karaoke")).toBe("春の歌配信");
  });

  // #5 まとめて適用
  it("applies every rule together", () => {
    expect(cleanStreamTitle("【テスト】歌配信 - ミナミイズミ ch #singing")).toBe(
      "歌配信"
    );
  });

  // #6 全部消えたら空文字（呼び出し側でフォールバックする）
  it("returns an empty string when nothing is left", () => {
    expect(cleanStreamTitle("【歌枠】")).toBe("");
  });
});
