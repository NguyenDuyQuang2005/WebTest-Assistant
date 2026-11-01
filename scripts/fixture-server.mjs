import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "fixtures", "sites");
const port = Number(process.env.FIXTURE_PORT ?? 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (url.pathname === "/http-error") {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("fixture 500");
    return;
  }
  if (url.pathname === "/slow") {
    setTimeout(() => {
      const file = join(root, "slow.html");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(readFileSync(file));
    }, 1200);
    return;
  }
  if (url.pathname === "/unreachable") {
    req.socket.destroy();
    return;
  }

  let filePath = join(root, url.pathname === "/" ? "valid.html" : url.pathname);
  if (!extname(filePath)) {
    filePath += ".html";
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  const type = mime[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  res.end(readFileSync(filePath));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Fixture server http://127.0.0.1:${port}`);
});
