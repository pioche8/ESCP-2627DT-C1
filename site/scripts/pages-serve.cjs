// site/scripts/pages-serve.cjs — serves the repository the way GitHub Pages serves main (10 Nov 2026, pass 9, ADR-0005),
// so the checks of the Pages export run on the same paths as the live site:
//   https://pioche8.github.io/ESCP-2627DT-C1/          the app (index.html at the root of main)
//   https://pioche8.github.io/ESCP-2627DT-C1/website/  the website (the committed export in website/)
// Pages rules emulated: the repository is served under /ESCP-2627DT-C1/; a directory answers with its index.html, and
// without a trailing slash it is first redirected (301) to the slash form; x answers with x.html when there is no folder x; anything else is
// 404; every response carries Access-Control-Allow-Origin: * as Pages does.
//   node scripts/pages-serve.cjs [port]      → http://127.0.0.1:<port>/ESCP-2627DT-C1/website/  (Ctrl-C to stop)
//   const { servePages } = require('./pages-serve.cjs'); const srv = await servePages();   (port 0: any free port)
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '../..');
const REPO_PATH = '/ESCP-2627DT-C1';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.md': 'text/markdown; charset=utf-8' };

function servePages(port = 0, log = null) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      let p = decodeURIComponent(url.pathname);
      const head = { 'Access-Control-Allow-Origin': '*' };
      const notFound = () => { res.writeHead(404, { ...head, 'Content-Type': 'text/plain' }); res.end('404 not found'); if (log) log(404, req.url); };
      if (p !== REPO_PATH && !p.startsWith(REPO_PATH + '/')) return notFound();
      p = p.slice(REPO_PATH.length) || '/';
      let abs = path.join(ROOT, p);
      if (!abs.startsWith(ROOT) || p.split('/').some((s) => s === '.git')) return notFound();
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        if (!p.endsWith('/')) { res.writeHead(301, { ...head, Location: REPO_PATH + p + '/' + (url.search || '') }); res.end(); return; }
        abs = path.join(abs, 'index.html');
      } else if (!fs.existsSync(abs) && fs.existsSync(abs + '.html')) abs += '.html';
      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return notFound();
      res.writeHead(200, { ...head, 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(abs).pipe(res);
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
module.exports = { servePages, REPO_PATH };

if (require.main === module) {
  servePages(+(process.argv[2] || 4600)).then((srv) => console.log('pages-serve: http://127.0.0.1:' + srv.address().port + REPO_PATH + '/website/  (the app at ' + REPO_PATH + '/)'));
}
