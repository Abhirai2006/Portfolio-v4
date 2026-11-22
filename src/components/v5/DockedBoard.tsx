import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "./Board";
import { CHAPTERS, CHAPTER_TITLES, REPLY_LINES, moveText, positionAt, type ChapterId, type Reply } from "@/lib/chess/lines";
import { cn } from "@/lib/utils";

function plyFor(reply: Reply, chapter: ChapterId) {
  const line = REPLY_LINES[reply];
  return chapter === "finale" ? line.moves.length : line.chapterAtPly[chapter];
}

/**
 * The game follows you down the page: each chapter is a position. Corner card on wide screens,
 * a small pill on phones that opens into the same card. Hidden while the hero is on screen.
 */
export function DockedBoard({
  reply,
  active,
  onJump,
}: {
  reply: Reply;
  active: ChapterId | null;
  onJump: (c: ChapterId) => void;
}) {
  const [open, setOpen] = useState(false);
  const chapter = active ?? "origin";
  const ply = plyFor(reply, chapter);
  const fen = useMemo(() => positionAt(reply, ply), [reply, ply]);
  const last = useMemo(() => {
    const g = new Chess();
    for (const m of REPLY_LINES[reply].moves.slice(0, ply)) g.move(m);
    const h = g.history({ verbose: true }).at(-1);
    return h ? [h.from, h.to] : [];
  }, [reply, ply]);
  const lastMoveText = moveText(reply, ply).split(" ").slice(-2).join(" ");

  if (!active) return null;

  const card = (
    <div className="w-56 rounded-2xl border-2 border-line bg-paper p-3 shadow-[6px_6px_0_var(--panel-shadow)]">
      <Board fen={fen} highlight={last} label={`Position for ${CHAPTER_TITLES[chapter]}: ${moveText(reply, ply)}`} />
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{lastMoveText}</p>
      <nav aria-label="Chapters" className="mt-2">
        <ol className="space-y-0.5">
          {CHAPTERS.map((c, i) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  onJump(c);
                  setOpen(false);
                }}
                aria-current={c === chapter ? "step" : undefined}
                className={cn(
                  "w-full rounded-md px-2 py-0.5 text-left text-xs transition",
                  c === chapter ? "bg-foreground font-semibold text-background" : "hover:bg-muted",
                )}
              >
                <span className="mr-1 font-mono opacity-60">{i + 1}.</span>
                {CHAPTER_TITLES[c]}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 hidden xl:block">{card}</div>
      <div className="fixed bottom-3 right-3 z-40 xl:hidden">
        {open && <div className="mb-2">{card}</div>}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex items-center gap-2 rounded-full border-2 border-line bg-paper px-3 py-1.5 text-xs font-semibold shadow-[4px_4px_0_var(--panel-shadow)]"
        >
          <span aria-hidden="true">♞</span>
          <span className="font-mono">{lastMoveText}</span>
          <span className="text-muted-foreground">· {CHAPTER_TITLES[chapter]}</span>
        </button>
      </div>
    </>
  );
}
