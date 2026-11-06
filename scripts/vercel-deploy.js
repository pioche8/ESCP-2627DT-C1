#!/usr/bin/env node
/*
 * scripts/vercel-deploy.js — one Vercel deployment from GitHub Actions (docs/adr/0003-vercel-from-github-actions.md).
 *
 *   node scripts/vercel-deploy.js <app|site> <production|preview>
 *   node scripts/vercel-deploy.js <app|site> --settings      prints the project settings it would create, then exits
 *
 * Needs VERCEL_TOKEN and VERCEL_ORG_ID in the environment (a team ID "team_…" or a personal account ID; never printed)
 * and the Vercel CLI on PATH (pinned in .github/workflows/vercel.yml). Run from the repository root.
 *   1. Looks the project up by name in that scope; when it is missing, creates it with the settings of its vercel.json
 *      (plus Node 22.x) and no Git connection, so only this workflow deploys it (ADR-0003 point 8).
 *   2. vercel pull → vercel build → vercel deploy --prebuilt (--prod for production): Vercel serves what this runner built.
 *   3. Appends url= (this deployment), domain= (the project's production domain) and project_id= to $GITHUB_OUTPUT.
 * No dependencies (Node 22's fetch).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PROJECTS = {
  app: { name: 'escp-2627dt-c1', config: 'vercel.json', rootDirectory: null },
  site: { name: 'escp-2627dt-c1-site', config: 'site/vercel.json', rootDirectory: 'site' }
};
const NODE_VERSION = '22.x';
const API = 'https://api.vercel.com';

// The settings a new project gets: what its vercel.json says, the root directory, Node 22.x. Nothing else.
function settings(kind) {
  const p = PROJECTS[kind];
  if (!p) throw new Error('unknown project "' + kind + '" (app or site)');
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, p.config), 'utf8'));
  const s = { name: p.name, framework: v.framework === undefined ? null : v.framework, rootDirectory: p.rootDirectory, nodeVersion: NODE_VERSION };
  ['buildCommand', 'installCommand', 'outputDirectory'].forEach((k) => { if (v[k]) s[k] = v[k]; });
  return s;
}

function fail(msg) { console.log('::error title=Vercel deploy::' + msg); process.exit(1); }

async function api(method, route, body) {
  const org = process.env.VERCEL_ORG_ID || '';
  const scope = org.indexOf('team_') === 0 ? (route.indexOf('?') === -1 ? '?' : '&') + 'teamId=' + encodeURIComponent(org) : '';
  const res = await fetch(API + route + scope, {
    method,
    headers: { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* empty body */ }
  return { status: res.status, json };
}

function cli(args, env) {
  // The token goes in as an argument (GitHub masks it in the log); stdout is captured, the CLI's progress goes to stderr.
  const r = spawnSync('vercel', args.concat(['--token', process.env.VERCEL_TOKEN]), { cwd: ROOT, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) fail('vercel ' + args[0] + ' exited ' + r.status + (r.stdout ? ': ' + r.stdout.trim().split('\n').slice(-3).join(' / ') : ''));
  return (r.stdout || '').trim();
}

function output(key, value) {
  console.log(key + '=' + value);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, key + '=' + value + '\n');
}

async function main() {
  const kind = process.argv[2];
  const target = process.argv[3];
  if (target === '--settings') { console.log(JSON.stringify(settings(kind), null, 2)); return; }
  if (!PROJECTS[kind] || ['production', 'preview'].indexOf(target) === -1) fail('usage: node scripts/vercel-deploy.js <app|site> <production|preview>');
  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_ORG_ID) fail('VERCEL_TOKEN and VERCEL_ORG_ID must be set (docs/DEPLOY.md §0)');
  const want = settings(kind);

  // 1. Find or create the project.
  let r = await api('GET', '/v9/projects/' + encodeURIComponent(want.name));
  if (r.status === 404) {
    console.log('Project ' + want.name + ' does not exist in this scope: creating it (' + JSON.stringify(want) + ')');
    r = await api('POST', '/v11/projects', want);
    if (r.status === 403) fail('creating ' + want.name + ' was refused (HTTP 403: ' + ((r.json && r.json.error && r.json.error.message) || 'forbidden') + '). Use a token and VERCEL_ORG_ID from a scope where you may create projects, for example your personal account (docs/DEPLOY.md §0).');
    if (r.status !== 200 && r.status !== 201) fail('creating ' + want.name + ' answered HTTP ' + r.status + ': ' + JSON.stringify(r.json && r.json.error || r.json));
    console.log('Created ' + want.name + ' (' + r.json.id + ')');
  } else if (r.status === 403 || r.status === 401) {
    fail('reading ' + want.name + ' answered HTTP ' + r.status + ': the token cannot see this scope. Check that VERCEL_ORG_ID is the scope the token was created for (docs/DEPLOY.md §0).');
  } else if (r.status !== 200) {
    fail('reading ' + want.name + ' answered HTTP ' + r.status + ': ' + JSON.stringify(r.json && r.json.error || r.json));
  } else {
    console.log('Linked to the existing project ' + want.name + ' (' + r.json.id + ')');
  }
  const projectId = r.json.id;
  output('project_id', projectId);

  // 2. pull → build → deploy --prebuilt, linked through the environment (no .vercel/ committed, no `vercel link`).
  const env = Object.assign({}, process.env, { VERCEL_ORG_ID: process.env.VERCEL_ORG_ID, VERCEL_PROJECT_ID: projectId });
  const prod = target === 'production';
  cli(['pull', '--yes', '--environment=' + target], env);
  cli(prod ? ['build', '--prod'] : ['build'], env);
  const out = cli(prod ? ['deploy', '--prebuilt', '--prod'] : ['deploy', '--prebuilt'], env);
  const url = (out.match(/https:\/\/[^\s]+\.vercel\.app\S*/g) || []).pop();
  if (!url) fail('vercel deploy printed no deployment URL: ' + out.slice(-300));
  output('url', url.replace(/\/$/, ''));

  // 3. The production domain (the one the post-deploy checks and the pull-request comment use).
  const d = await api('GET', '/v9/projects/' + projectId + '/domains');
  const domains = (d.json && d.json.domains) || [];
  const pick = domains.find((x) => /\.vercel\.app$/.test(x.name) && !x.redirect && !x.gitBranch) || domains.find((x) => !x.redirect && !x.gitBranch);
  output('domain', pick ? pick.name : want.name + '.vercel.app');
}

if (require.main === module) main().catch((e) => fail(e && e.message || String(e)));

module.exports = { PROJECTS, settings, NODE_VERSION };
