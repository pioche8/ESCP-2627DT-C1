#!/usr/bin/env node
/*
 * scripts/vercel-changed.js — which Vercel projects a range of commits touches (docs/adr/0003-vercel-from-github-actions.md).
 *
 *   node scripts/vercel-changed.js <base> <head>     prints a JSON array: [], ["app"], ["site"] or ["app","site"]
 *   node scripts/vercel-changed.js all               prints ["app","site"]
 *
 * The paths are read from the `ignoreCommand` of vercel.json (the app) and site/vercel.json (the site), the same lists
 * Vercel's own Git integration would use (ADR-0001 point 3), so there is one list per project. A base that is empty, all
 * zeros (a new branch) or not in the history counts as "everything changed". Appends `projects=<json>` to $GITHUB_OUTPUT
 * when it is set. No dependencies.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIGS = { app: { file: 'vercel.json', dir: '' }, site: { file: 'site/vercel.json', dir: 'site/' } };

// The repository-relative paths a project watches: the words between "HEAD --" and "|| exit 1" in its ignoreCommand.
function watched(kind) {
  const c = CONFIGS[kind];
  const cmd = JSON.parse(fs.readFileSync(path.join(ROOT, c.file), 'utf8')).ignoreCommand || '';
  const m = cmd.match(/ HEAD -- (.+?) \|\| exit 1$/);
  if (!m) throw new Error(c.file + ': ignoreCommand has no "HEAD -- <paths> || exit 1" part');
  return m[1].trim().split(/\s+/).map((p) => p === '.' ? c.dir.replace(/\/$/, '') : c.dir + p);
}

function touches(file, paths) {
  return paths.some((p) => file === p || file.startsWith(p + '/'));
}

function changed(base, head) {
  const all = Object.keys(CONFIGS);
  if (!base || /^0+$/.test(base) || base === 'all') return all;
  const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (git(['cat-file', '-e', base + '^{commit}']).status !== 0) return all; // not in this clone: deploy everything
  const r = git(['diff', '--name-only', base, head || 'HEAD']);
  if (r.status !== 0) return all;
  const files = r.stdout.split('\n').filter(Boolean);
  return all.filter((k) => { const w = watched(k); return files.some((f) => touches(f, w)); });
}

if (require.main === module) {
  const out = changed(process.argv[2], process.argv[3]);
  const json = JSON.stringify(out);
  console.log(json);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'projects=' + json + '\n');
}

module.exports = { watched, changed, touches };
