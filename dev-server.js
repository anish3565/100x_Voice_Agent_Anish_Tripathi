const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3100;
const routes = {
  '/api/ask': require(path.join(ROOT, 'api', 'ask.js')),
};

function shim(req, res, body) {
  return {
    method: req.method,
    body,
    setHeader(k, v) { res.setHeader(k, v); },
    status(c) { res.statusCode = c; return this; },
    json(b) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(b)); },
    end(b) { res.end(b); },
  };
}

http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (routes[pathname]) {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      const s = shim(req, res, body);
      routes[pathname](s, s);
    });
    return;
  }
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(ROOT, 'index.html')));
    return;
  }
  res.statusCode = 404;
  res.end('not found');
}).listen(PORT, () => console.log(`Voice bot running at http://localhost:${PORT}`));
