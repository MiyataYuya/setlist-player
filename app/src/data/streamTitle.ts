/** 配信タイトルから定型句を除いて表示用に短くする。残らなければ空文字。 */
export function cleanStreamTitle(title: string): string {
  return title
    .replace(/【[^】]*】/g, "") // 【...】全体を除去
    .replace(/\s*-\s*ミナミイズミ.*$/, "") // " - ミナミイズミ ..." 除去
    .replace(/\s*singing stream.*$/i, "") // "singing stream ..." 除去
    .replace(/\s*#\S+/g, "") // ハッシュタグ除去
    .trim();
}
