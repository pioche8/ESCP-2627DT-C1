/*
 * tests/lib/section.js — the one owner of a gate's browser (pass 3, CLAUDE.md §11 item 149;
 * docs/reports/2026-11-06-pass-3-deepen.md item 1). Dev-only, like Playwright.
 *
 *   const { section } = require('./lib/section');
 *   const ok = await section('dark · iPhone SE', async (browser, step) => { step('feed'); ... }, { engine: 'webkit' });
 *
 * Launches the browser, hands it to fn with step(label) for naming the screen the run is on, and always closes it.
 * A crash, or a section still running after its deadline (SMOKE_SECTION_MINUTES, 4 by default: about five times the
 * slowest section on a loaded machine), prints one line,
 *     FAIL <section> crashed at step "<step>": <first line of the error>     (or: timed out at step …)
 * and returns false, so the caller counts one failure and runs its next section in a fresh browser. A crashed section
 * can therefore neither hide the sections after it nor keep node alive with an open browser (the hangs of 5 and 6 Nov).
 * There are no retries: a crash is reported with its step, and a person decides whether to rerun.
 * SMOKE_DEBUG=1 also prints the stack.
 */
'use strict';

const MINUTES = +(process.env.SMOKE_SECTION_MINUTES || 4);

function within(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((resolve) => { t = setTimeout(resolve, ms); })]).finally(() => clearTimeout(t));
}

async function section(name, fn, opts) {
  const o = opts || {};
  const playwright = o.playwright || require('playwright');
  const engine = o.engine || 'chromium';
  const minutes = o.minutes || MINUTES;
  let current = 'launch';
  let browser = null, timer = null, timedOut = false;
  const step = (label) => { current = String(label); };
  try {
    browser = await playwright[engine].launch();
    current = 'start';
    const work = Promise.resolve().then(() => fn(browser, step));
    work.catch(() => {}); // after a timeout the section's pending call rejects when the browser closes; that is expected
    const deadline = new Promise((resolve, reject) => {
      timer = setTimeout(() => { timedOut = true; reject(new Error('still running after ' + minutes + ' min (SMOKE_SECTION_MINUTES)')); }, minutes * 60000);
    });
    await Promise.race([work, deadline]);
    return true;
  } catch (e) {
    const msg = String((e && e.message) || e).split('\n')[0];
    console.log('  FAIL ' + name + ' ' + (timedOut ? 'timed out' : 'crashed') + ' at step "' + current + '": ' + msg);
    if (process.env.SMOKE_DEBUG && e && e.stack) console.log(e.stack);
    return false;
  } finally {
    clearTimeout(timer);
    if (browser) await within(browser.close().catch(() => {}), 15000); // a wedged browser cannot hold the gate either
  }
}

module.exports = { section, MINUTES };
