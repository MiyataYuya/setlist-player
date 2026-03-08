/// <reference types="vite/client" />

declare module "virtual:songs" {
  import type { Song } from "./data/types";
  const songs: Song[];
  export default songs;
}

declare module "virtual:performances" {
  import type { Performance } from "./data/types";
  const performances: Performance[];
  export default performances;
}
