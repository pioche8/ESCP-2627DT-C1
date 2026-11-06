#!/usr/bin/env node
/*
 * tests/no-live-ai-check.js — CLAUDE.md §7.2 ("no live AI calls and no API keys in the repo") as a CI gate (6 Nov 2026).
 *
 *   node tests/no-live-ai-check.js
 *
 * Fails if the website gains a server route (any file under site/src/app/api/, or a route.ts / route.js anywhere in
 * site/src/app: the first runtime that could call a model) or if any tracked text file holds something shaped like a
 * model API key (sk-…, sk-ant-…, sk-proj-…, 32+ characters, not part of a longer word). ADR-0002
 * (docs/adr/0002-real-tender-reader.md) records the real-model idea as "Proposed, not built"; building it means
 * changing §7.2 first (a team decision with the lecturer), and then this check with it, in the same pull request.
 * A self-test proves the pattern catches a key and ignores the words that look alike (desk-research, Grotesk-normal).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const KEY = /(?<![A-Za-z0-9_-])sk-(?:ant-|proj-|live-|test-)?[A-Za-z0-9_-]{32,}/;
const problems = [];

// 0. self-test: the pattern must catch a key-shaped string and leave look-alikes alone
const fake = 'sk-' + 'ant-' + 'api03-' + 'x'.repeat(40);
if (!KEY.test('const k = "' + fake + '";')) problems.push('self-test: the key pattern misses a key-shaped string');
['#5-desk-research-separate-from-interview-evidence', 'HankenGrotesk-normal-400to800-latin-ext.woff2', 'task-' + 'a'.repeat(40)]
  .forEach((s) => { if (KEY.test(s)) problems.push('self-test: the key pattern flags a harmless string: ' + s); });

// 1. no server route on the website
let files = [];
try { files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter(Boolean); } catch (e) { problems.push('git ls-files failed: ' + e.message); }
files.filter((f) => /^site\/src\/app\/(.*\/)?api\//.test(f) || /^site\/src\/app\/(.*\/)?route\.(t|j)sx?$/.test(f))
  .forEach((f) => problems.push(f + ': a server route on the website (CLAUDE.md §7.2, ADR-0002: Proposed, not built)'));

// 2. no key-shaped strings in tracked text files
files.forEach((f) => {
  if (/\.(png|jpe?g|webp|gif|ico|woff2?|mp4|pdf|zip)$/i.test(f) || /(^|\/)package-lock\.json$/.test(f)) return;
  let text;
  try { text = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return; } // deleted in the working tree
  if (text.indexOf('\0') !== -1) return; // binary
  const m = KEY.exec(text);
  if (m) {
    const line = text.slice(0, m.index).split('\n').length;
    problems.push(f + ':' + line + ': something shaped like an API key (' + m[0].slice(0, 7) + '…); keys never go in the repository (CLAUDE.md §7.2)');
  }
});

if (problems.length) { console.log('no-live-ai check: ' + problems.length + ' problem(s)'); problems.forEach((p) => console.log('  FAIL ' + p)); process.exitCode = 1; }
else console.log('no-live-ai check: no server route on the website, no key-shaped string in ' + files.length + ' tracked files (self-test ok)');
