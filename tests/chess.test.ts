import { describe, expect, test } from "bun:test";
import { Chess } from "chess.js";
import { CHAPTERS, ENTRANCE, REPLY_LINES, positionAt, type Reply } from "@/lib/chess/lines";
import { MARSHALL, checkFinaleMove } from "@/lib/chess/marshall";

const REPLIES = Object.keys(REPLY_LINES) as Reply[];

describe("reply lines", () => {
  test("there are exactly the four planned replies", () => {
    expect([...REPLIES].sort()).toEqual(["Nf6", "c5", "d5", "g6"]);
  });

  test.each(REPLIES)("%s line is legal and starts 1.Nf3 + reply", (reply) => {
    const { moves } = REPLY_LINES[reply];
    expect(moves[0]).toBe(ENTRANCE);
    expect(moves[1]).toBe(reply);
    const game = new Chess();
    for (const san of moves) expect(() => game.move(san)).not.toThrow();
  });

  test.each(REPLIES)("%s line maps every chapter before the finale, in homepage order", (reply) => {
    const { moves, chapterAtPly } = REPLY_LINES[reply];
    const plies = CHAPTERS.filter((c) => c !== "finale").map(
      (c) => chapterAtPly[c as Exclude<typeof c, "finale">],
    );
    for (const p of plies) expect(p).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < plies.length; i++) expect(plies[i]).toBeGreaterThan(plies[i - 1]);
    expect(plies[plies.length - 1]).toBeLessThanOrEqual(moves.length);
  });

  test("positionAt replays the line up to a ply", () => {
    const game = new Chess();
    game.move("Nf3");
    game.move("d5");
    expect(positionAt("d5", 2)).toBe(game.fen());
  });
});

describe("Levitsky vs Marshall, Breslau 1912", () => {
  test("the PGN replays to the board in Wikipedia's final diagram", () => {
    const game = new Chess();
    game.loadPgn(MARSHALL.pgn);
    expect(game.fen().split(" ")[0]).toBe("5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1");
    expect(MARSHALL.finalBoard).toBe("5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1");
  });

  test("the puzzle is the position before 23...Qg3, black to move", () => {
    const game = new Chess(MARSHALL.puzzleFen);
    expect(game.turn()).toBe("b");
    game.move(MARSHALL.solution);
    expect(game.fen().split(" ")[0]).toBe(MARSHALL.finalBoard);
  });

  test("finale move checker", () => {
    expect(checkFinaleMove("Qg3")).toBe("solved");
    expect(checkFinaleMove("Qb4")).toBe("legal-wrong");
    expect(checkFinaleMove("Ke7")).toBe("illegal");
    expect(checkFinaleMove("")).toBe("illegal");
  });
});
