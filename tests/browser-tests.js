#!/usr/bin/env node
/*
 * tests/browser-tests.js — runs tests.html (the engine tests and the demo pins) in Chromium, over file:// and over HTTP,
 * and fails on any page error or failed assertion (5 Nov 2026). Dev-only: needs Playwright + Chromium like tests/smoke.js.
 *
 *   node tests/browser-tests.js
 */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i --no-save playwright && npx playwright install chromium'); process.exit(2); }

const { section } = require('./lib/section'); // launches, names the step, closes the browser even after a crash
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].replace(/^\//, '') || 'index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const urls = ['file://' + path.join(ROOT, 'tests.html'), 'http://127.0.0.1:' + srv.address().port + '/tests.html'];
  let failures = 0;
  const finished = await section('tests.html', async (browser, step) => { for (const url of urls) {
    step(url.replace(ROOT, '<repo>'));
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/^FAIL/.test(m.text())) problems.push('console: ' + m.text()); });
    page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
    await page.goto(url);
    await page.waitForFunction(() => /demo pins hold/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    const items = await page.locator('#out li').allInnerTexts();
    const ok = items.filter((t) => /^ok\b/.test(t)).length, bad = items.filter((t) => /^FAIL/.test(t));
    const summary = items.filter((t) => /tests passed|demo pins hold/.test(t)).map((t) => t.trim()).join(' · ');
    const good = bad.length === 0 && problems.length === 0 && /tests passed/.test(summary) && /demo pins hold/.test(summary);
    if (!good) failures++;
    console.log((good ? 'ok   ' : 'FAIL ') + url.replace(ROOT, '<repo>') + ' · ' + ok + ' ok · ' + summary + (bad.length ? '\n     ' + bad.join('\n     ') : '') + (problems.length ? '\n     ' + problems.join('\n     ') : ''));
    await page.close();
  } }, { playwright });
  if (!finished) failures++;
  srv.close();
  console.log(failures ? 'tests.html: ' + failures + ' run(s) failed' : 'tests.html passes over file:// and HTTP with 0 page errors');
  process.exit(failures ? 1 : 0); // explicit, like tests/smoke.js: nothing left open can keep the gate waiting
})();
