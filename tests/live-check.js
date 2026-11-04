/*
 * tests/live-check.js — is GitHub Pages serving this checkout?
 *
 *   node tests/live-check.js                                      (checks https://pioche8.github.io/ESCP-2627DT-C1/)
 *   node tests/live-check.js https://<user>.github.io/<repo>/     (another deployment)
 *
 * Downloads the deployed index.html, engine.js, app.js, data.js, ai.js, styles.css and shared/tokens.css and compares
 * each byte for byte (SHA-256) with the local files, so you know the live URL serves the commit you have checked out.
 * Then checks that the no-slash URL redirects to the slash URL with ?demo=reset,fast intact (GitHub Pages' directory
 * redirect keeps the query string; the app then rewrites the address to ?demo=fast itself).
 * No dependencies. Exit code 1 on any difference or failed request. Run it from a machine that can reach github.io;
 * then run the smoke test against the same URL:  SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = (process.argv[2] || 'https://pioche8.github.io/ESCP-2627DT-C1/').replace(/\/?$/, '/');
const FILES = ['index.html', 'engine.js', 'app.js', 'data.js', 'ai.js', 'styles.css', 'shared/tokens.css'];

function get(url, follow) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'tenderscout-live-check', 'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache' } }, (res) => {
      if (follow && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return resolve(get(new URL(res.headers.location, url).href, follow)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

(async () => {
  let head = '';
  try { head = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* not a checkout */ }
  let failures = 0;
  console.log('Live deployment check · ' + BASE + (head ? ' · local HEAD ' + head : ''));
  for (const f of FILES) {
    const local = fs.readFileSync(path.join(ROOT, f));
    let r;
    try { r = await get(BASE + f, true); } catch (e) { failures++; console.log('  FAIL ' + f + ' · ' + e.message); continue; }
    if (r.status !== 200) { failures++; console.log('  FAIL ' + f + ' · HTTP ' + r.status); continue; }
    const same = sha(r.body) === sha(local);
    if (!same) failures++;
    console.log('  ' + (same ? 'ok   ' : 'FAIL ') + f + ' · ' + r.body.length + ' bytes' + (same ? ' · identical' : ' · DIFFERS from the local file (' + local.length + ' bytes)') +
      (r.headers['last-modified'] ? ' · served ' + r.headers['last-modified'] : ''));
  }
  const noSlash = BASE.replace(/\/$/, '') + '?demo=reset,fast';
  try {
    const r = await get(noSlash, false);
    const loc = r.headers.location || '';
    const ok = r.status >= 300 && r.status < 400 && /[?&]demo=reset,fast/.test(loc);
    if (!ok) failures++;
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + 'redirect · ' + noSlash + ' → HTTP ' + r.status + (loc ? ' ' + loc : '') + (ok ? ' (query kept)' : ''));
  } catch (e) { failures++; console.log('  FAIL redirect · ' + e.message); }
  try {
    const r = await get(BASE + '?demo=reset,fast', true);
    const ok = r.status === 200 && /<title>TenderScout<\/title>/.test(r.body.toString());
    if (!ok) failures++;
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + 'the demo URL answers 200 with the app shell');
  } catch (e) { failures++; console.log('  FAIL demo URL · ' + e.message); }
  console.log(failures ? '\n' + failures + ' check(s) failed: the live site does not serve this checkout (Pages may still be building: repo → Actions → "pages build and deployment")' : '\nLive site serves this checkout' + (head ? ' (' + head + ')' : ''));
  process.exitCode = failures ? 1 : 0;
})();
