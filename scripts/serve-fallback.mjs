#!/usr/bin/env node
/**
 * Serves web-main/ — the static fallback portfolio (no Next.js, no build step).
 * Usage: npm run fallback
 */

import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join, extname, normalize } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "web-main");
const PORT = Number(process.env.FALLBACK_PORT || 3001);
const HOST = process.env.FALLBACK_HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${HOST}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let st = await stat(filePath).catch(() => null);
    if (st?.isDirectory()) {
      const indexPath = join(filePath, "index.html");
      st = await stat(indexPath).catch(() => null);
      if (!st?.isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      return send(indexPath, res);
    }

    if (!st?.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }

    await send(filePath, res);
  } catch {
    res.writeHead(500).end("Server error");
  }
});

async function send(filePath, res) {
  const body = await readFile(filePath);
  const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type }).end(body);
}

server.listen(PORT, HOST, () => {
  console.log(`Fallback portfolio (web-main/)`);
  console.log(`  → http://${HOST}:${PORT}`);
  console.log(`  Christie’s: http://${HOST}:${PORT}/projects/pageone.html`);
  console.log(`Press Ctrl+C to stop.`);
});
