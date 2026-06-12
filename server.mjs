import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import chatHandler from "./api/chat.js";

const root = process.cwd();
const port = process.env.PORT || 3000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function createMockResponse(res) {
  return {
    setHeader: (...args) => res.setHeader(...args),
    end: (...args) => res.end(...args),
    get statusCode() {
      return res.statusCode;
    },
    set statusCode(value) {
      res.statusCode = value;
    }
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const filePath = normalize(join(root, pathname));

  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    res.setHeader("Content-Type", contentTypes[extname(filePath)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  if (req.url?.startsWith("/api/chat")) {
    await chatHandler(req, createMockResponse(res));
    return;
  }

  await serveStatic(req, res);
}).listen(port, () => {
  console.log(`AI Avatar Platform running on http://localhost:${port}`);
});
