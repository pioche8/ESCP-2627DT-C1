/*
 * tests/section.test.js — the browser owner of the gates (tests/lib/section.js) keeps its promises, node only, no browser:
 *
 *   node tests/section.test.js
 *
 * A fake Playwright stands in for the real one. A section that passes returns true; one that throws returns false and
 * prints its name, "crashed" and the step it was on; one that never ends is stopped at its deadline and prints "timed
 * out" with its step; in all three cases the browser is closed exactly once, and a call that rejects after the timeout
 * (as Playwright's pending calls do when the browser closes) does not become an unhandled rejection.
 */
'use strict';
const assert = require('assert');
const { section } = require('./lib/section');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

function fake() {
  const state = { launched: 0, closed: 0, onClose: [] };
  const browser = { close: () => { state.closed++; state.onClose.forEach((f) => f()); return Promise.resolve(); } };
  return { state, playwright: { chromium: { launch: async () => { state.launched++; return browser; } } } };
}

async function quietly(fn) { // capture the section's console lines
  const lines = [], log = console.log;
  console.log = (l) => lines.push(String(l));
  try { return { value: await fn(), lines }; } finally { console.log = log; }
}

let unhandled = 0;
process.on('unhandledRejection', () => { unhandled++; });

(async () => {
  console.log('tests/lib/section.js');
  await test('a section that passes returns true and closes its browser once', async () => {
    const f = fake();
    const r = await quietly(() => section('dark', async (b, step) => { step('feed'); }, { playwright: f.playwright }));
    assert.strictEqual(r.value, true);
    assert.deepStrictEqual([f.state.launched, f.state.closed], [1, 1]);
    assert.deepStrictEqual(r.lines, []);
  });
  await test('a crash returns false, names the section and the step, and still closes the browser', async () => {
    const f = fake();
    const r = await quietly(() => section('light · iPhone SE', async (b, step) => { step('feed'); step('hohenau'); throw new Error("page.waitForSelector: Timeout 8000ms exceeded.\nCall log: …"); }, { playwright: f.playwright }));
    assert.strictEqual(r.value, false);
    assert.strictEqual(f.state.closed, 1);
    assert.deepStrictEqual(r.lines, ['  FAIL light · iPhone SE crashed at step "hohenau": page.waitForSelector: Timeout 8000ms exceeded.']);
  });
  await test('a section past its deadline is stopped, reported as timed out at its step, and its browser closed', async () => {
    const f = fake();
    const r = await quietly(() => section('reduced motion', (b, step) => { step('Company re-score'); return new Promise((resolve, reject) => { f.state.onClose.push(() => reject(new Error('Target closed'))); }); }, { playwright: f.playwright, minutes: 0.001 }));
    assert.strictEqual(r.value, false);
    assert.strictEqual(f.state.closed, 1);
    assert.ok(/^  FAIL reduced motion timed out at step "Company re-score": still running after/.test(r.lines[0]), r.lines[0]);
  });
  await test('a launch that fails is reported at step "launch" and nothing is left to close', async () => {
    const r = await quietly(() => section('dark', async () => {}, { playwright: { chromium: { launch: async () => { throw new Error('browserType.launch: Executable doesn\'t exist'); } } } }));
    assert.strictEqual(r.value, false);
    assert.ok(/crashed at step "launch": browserType\.launch/.test(r.lines[0]), r.lines[0]);
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  await test('the rejection of a call still pending after a timeout is not an unhandled rejection', async () => {
    assert.strictEqual(unhandled, 0);
  });
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed ? 1 : 0;
})();
