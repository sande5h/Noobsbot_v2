import { createServer } from "http";
import { parse } from "url";
import { existsSync } from "fs";
import next from "next";

const port = parseInt(process.env.PORT ?? "3000");
const hostname = process.env.HOST ?? "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

if (!dev && !existsSync(".next/prerender-manifest.json")) {
  console.error("No production build found. Run `npm run build` locally and upload the .next folder.");
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`noobsbot-v2 ready on http://${hostname}:${port}`);
  });
});
