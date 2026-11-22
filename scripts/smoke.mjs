// Route smoke checks for the portfolio, run against a live dev or preview server.
//
//   bun run dev --host 127.0.0.1 --port 8080   (in another terminal)
//   bun run smoke -- --base http://127.0.0.1:8080
//
// For every route in tests/smoke.config.json, at four widths and in both themes:
// no page errors or console errors, no sideways scroll, and every "mustContain" /
// "mustContainJsOnly" string present. Then a pass with JavaScript disabled, which
// checks "mustContain" only (server-rendered HTML must carry the content).
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = arg("--base", "http://127.0.0.1:8080").replace(/\/$/, "");
const only = arg("--only", null);
const shots = process.env.SMOKE_SHOTS || "";
const config = JSON.parse(readFileSync(new URL("../tests/smoke.config.json", import.meta.url), "utf8"));
const WIDTHS = [360, 390, 768, 1280];
const THEMES = ["dark", "light"];
// Third-party fetches the sandbox or a visitor's network may block; not our bugs.
const IGNORE = [/github-contributions-api/, /api\.github\.com/, /supabase\.co/, /Failed to load resource/, /fonts\.g/];

if (shots) mkdirSync(shots, { recursive: true });
const failures = [];
const fail = (msg) => failures.push(msg);
const routes = config.routes.filter((r) => !only || r.path === only);

const browser = await chromium.launch();
for (const route of routes) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text()))) errors.push(`console: ${m.text()}`);
      });
      const tag = `${route.path} [${theme} ${width}px]`;
      const res = await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
      if (!res || res.status() >= 400) fail(`${tag}: HTTP ${res?.status()}`);
      await page.waitForTimeout(route.settleMs ?? 1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) fail(`${tag}: sideways scroll of ${overflow}px`);
      const text = await page.evaluate(() => document.body.innerText + " " + document.documentElement.innerHTML);
      for (const s of [...(route.mustContain ?? []), ...(route.mustContainJsOnly ?? [])]) {
        if (!text.includes(s)) fail(`${tag}: missing "${s}"`);
      }
      for (const e of errors) fail(`${tag}: ${e}`);
      if (shots) {
        const name = route.path.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "home";
        await page.screenshot({ path: `${shots}/${name}-${theme}-${width}.png` });
      }
      await ctx.close();
    }
  }
  // No-JS pass: server-rendered HTML alone.
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + route.path, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  for (const s of route.mustContain ?? []) if (!html.includes(s)) fail(`${route.path} [no-JS]: missing "${s}"`);
  await ctx.close();
}
await browser.close();

if (failures.length) {
  console.error(`SMOKE FAIL (${failures.length})\n` + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log(`SMOKE PASS (${routes.length} routes x ${WIDTHS.length} widths x ${THEMES.length} themes + no-JS)`);
