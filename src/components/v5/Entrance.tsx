import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "./Board";
import { ENTRANCE, REPLY_LINES, positionAt, type Reply } from "@/lib/chess/lines";

const REPLIES = Object.keys(REPLY_LINES) as Reply[];

/** Square offset in board squares (white at the bottom) for the arrival animation. */
function lastMove(reply: Reply | null) {
  const game = new Chess();
  game.move(ENTRANCE);
  if (reply) game.move(reply);
  const m = game.history({ verbose: true }).at(-1)!;
  const f = (s: string) => s.charCodeAt(0) - 97;
  const r = (s: string) => Number(s[1]);
  return { from: m.from, to: m.to, dx: f(m.from) - f(m.to), dy: r(m.to) - r(m.from) };
}

/**
 * The opening move. The server renders the board after 1.Nf3 and the four replies as real buttons,
 * so nothing here blocks reading; on the client the knight hops in from g1.
 */
export function Entrance({ reply, onReply }: { reply: Reply | null; onReply: (r: Reply) => void }) {
  const fen = useMemo(() => positionAt(reply ?? "d5", reply ? 2 : 1), [reply]);
  const lm = useMemo(() => lastMove(reply), [reply]);
  const [pressed, setPressed] = useState<Reply | null>(null);

  return (
    <div className="mx-auto w-full max-w-[24rem]">
      <Board
        key={reply ?? "start"}
        fen={fen}
        highlight={[lm.from, lm.to]}
        arrive={{ sq: lm.to, dx: lm.dx, dy: lm.dy }}
        label={reply ? `Board after 1.Nf3 ${reply}` : "Board after Abhishek's first move, 1.Nf3"}
      />
      <p className="mt-5 font-display text-lg font-bold">
        Abhishek opens 1.Nf3. <span className="text-primary">Your move.</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        The Réti: control the centre from a distance. Pick a reply and it takes you somewhere.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {REPLIES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={pressed === r}
            onClick={() => {
              setPressed(r);
              onReply(r);
            }}
            className="rounded-xl border-2 border-line bg-paper px-3 py-2 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--primary)_18%,var(--paper))] aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            1…{REPLY_LINES[r].label.replace(/^…/, "")}
          </button>
        ))}
      </div>
    </div>
  );
}
