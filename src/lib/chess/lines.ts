import { Chess } from "chess.js";

/** Abhishek plays white and always opens 1.Nf3 (the Réti). */
export const ENTRANCE = "Nf3";

/** Homepage chapters, in scroll order. Their ids are also the section anchors. */
export const CHAPTERS = [
  "origin",
  "arcs",
  "lab",
  "stats",
  "activity",
  "ask",
  "sidequest",
  "finale",
] as const;
export type ChapterId = (typeof CHAPTERS)[number];

export const CHAPTER_TITLES: Record<ChapterId, string> = {
  origin: "Origin",
  arcs: "The Arcs",
  lab: "Churn Lab",
  stats: "Stat Sheet",
  activity: "Live Activity",
  ask: "Ask Abhishek",
  sidequest: "Side Quest",
  finale: "The Finale",
};

export type Reply = "d5" | "Nf6" | "c5" | "g6";

type Line = {
  /** Button text for the visitor's reply. */
  label: string;
  /** Where this reply takes the visitor first. */
  firstChapter: ChapterId;
  /** SAN from move 1, white first. */
  moves: string[];
  /** Ply (1-based count of half-moves) shown when a chapter is in view. */
  chapterAtPly: Record<Exclude<ChapterId, "finale">, number>;
};

// Each chapter lands on the next white move, so the board always shows Abhishek's latest move.
const PLIES: Line["chapterAtPly"] = {
  origin: 3,
  arcs: 5,
  lab: 7,
  stats: 9,
  activity: 11,
  ask: 13,
  sidequest: 15,
};

const split = (s: string) => s.split(" ").filter((t) => !/^\d+\.$/.test(t));

export const REPLY_LINES: Record<Reply, Line> = {
  d5: {
    label: "…d5 · straight to the work",
    firstChapter: "arcs",
    moves: split("Nf3 d5 g3 Nf6 Bg2 c6 O-O Bg4 d3 Nbd7 Nbd2 e5 e4 dxe4 dxe4 Bc5"),
    chapterAtPly: PLIES,
  },
  Nf6: {
    label: "…Nf6 · start with who he is",
    firstChapter: "origin",
    moves: split("Nf3 Nf6 c4 e6 g3 d5 Bg2 Be7 O-O O-O b3 c5 Bb2 Nc6 e3 b6"),
    chapterAtPly: PLIES,
  },
  c5: {
    label: "…c5 · show me the model",
    firstChapter: "lab",
    moves: split("Nf3 c5 c4 Nc6 Nc3 g6 g3 Bg7 Bg2 Nf6 O-O O-O d4 cxd4 Nxd4 Nxd4"),
    chapterAtPly: PLIES,
  },
  g6: {
    label: "…g6 · let me ask him",
    firstChapter: "ask",
    moves: split("Nf3 g6 g3 Bg7 Bg2 Nf6 O-O O-O d3 d6 e4 e5 Nc3 Nc6 h3 h6"),
    chapterAtPly: PLIES,
  },
};

/** FEN after `ply` half-moves of a reply line (0 = start position). */
export function positionAt(reply: Reply, ply: number): string {
  const game = new Chess();
  for (const san of REPLY_LINES[reply].moves.slice(0, Math.max(0, ply))) game.move(san);
  return game.fen();
}

/** SAN move list up to `ply`, formatted "1.Nf3 d5 2.g3 …". */
export function moveText(reply: Reply, ply: number): string {
  const moves = REPLY_LINES[reply].moves.slice(0, ply);
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(" ");
}
