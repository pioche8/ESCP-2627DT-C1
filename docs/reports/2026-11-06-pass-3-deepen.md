# Test harness read, pass 3 (6 Nov 2026)

A read-only review of `tests/` and `.github/workflows/` on `main` at `908363c` (pass-3 step 3, `/agentic-council:deepen`). App code was out of scope. The goal was predictable gates.

The pain it starts from:
- On 5 and 6 Nov `tests/smoke.js` crashed under load and then hung: the crashed section's browser stayed open, so node never exited. Pass 2 stopped the hang with an explicit `process.exit` at the end.
- The iPhone SE run needed a rerun to pass.

The plugin's deepening rubric file is not part of this install, so the four criteria named in the command (depth, abstraction value, coupling, coherence) were applied directly.

**The shape today:** the gates are honest but **shallow at the browser boundary**.
- Nine places launch a browser:
  - `smoke.js` launches four, one per section.
  - `monkey.js`, `ui-frames.js`, `demo-record.js` and `browser-tests.js` launch one each.
  - `audit.cjs` and `a11y-motion.cjs` in `site/` launch the rest.
- They use three different exit disciplines.
- Each section of `smoke.js` decides on its own how to launch, close and report.
- A failure prints Playwright's selector and timeout, but not which screen of the demo path the run was on.

## Ranked opportunities (impact for the effort)

### 1. Nobody owns the browser's lifecycle (chosen)
**Signal:** shallow modules, and the same responsibility repeated with drift.
**Evidence:**
- In `tests/smoke.js`, the four sections each call `playwright[BROWSER].launch()` (lines 45, 443, 471, 507 at `908363c`) and close their own browser on the happy path only.
- One `try` wraps all four (line 607). So a crash in the dark section skips light, reduced motion, the error fallback and the test log, and it leaves the dark browser open. That is the hang of 5 and 6 Nov, now hidden by `process.exit`.
- `tests/browser-tests.js`, which is also a gate in CI and in the preflight, has the same shape with `process.exitCode`, so it can still hang the same way.
- There is no deadline anywhere but CI's job timeout (8 min). The preflight's `spawnSync` has none.

**Suggestion:** one small module, `tests/lib/section.js`, the only code that launches and closes a browser for a gate. `section(name, fn)` does five things:
- launches the configured engine;
- hands `fn` the browser and a `step(label)` function;
- enforces a named deadline per section (`SMOKE_SECTION_MINUTES`, 4 by default): when it passes, it closes the browser, which makes the pending call reject at once;
- **always** closes the browser in `finally`;
- on a crash or a timeout, prints one line: `FAIL <section> crashed at step "<step>": <first line of the error>`. Then the next section runs anyway.

`smoke.js` and `browser-tests.js` use it. The screen names the smoke test already passes to `scan()` and `shot()` become the steps, so no extra bookkeeping is needed.
**Impact:** High. Every crash names the screen it happened on; one bad section no longer hides the others; no section can hang a gate; and the explicit exit becomes a backstop, not the fix.

### 2. A failure does not say where on the demo path it happened
**Signal:** missing context at the interface. The run records 159 named checks but no named position.
**Evidence:** the pass-2 SE crash read `page.waitForSelector: Timeout 8000ms exceeded … waiting for locator('.vhead.v-nogo')`. That selector appears five times in `smoke.js`, so the message did not say which of the five it was.
**Suggestion:** this is the `step()` of item 1; it costs nothing more once a section owner exists.
**Impact:** High, but only together with item 1. Done with it.

### 3. The preflight waits forever on a hung gate
**Signal:** a missing timeout at the orchestrator.
**Evidence:** `tests/preflight.js` line 57: `spawnSync(g.cmd, …)` without `timeout`. A hung gate stops the preflight with no output, as the 28-minute hang of 6 Nov did.
**Suggestion:** a `timeout` per gate (for example 15 min for browser gates) that prints the gate as `FAIL (timed out after …)`.
**Impact:** Medium. Item 1's deadlines remove the known cause, so this would be a second guard. Not done in this pass (one deepening).

### 4. Fixed sleeps are used as synchronisation
**Signal:** temporal coupling to the machine's speed.
**Evidence:** 21 `waitForTimeout` calls in `smoke.js`: 450 ms before each screenshot, 360 ms after a sheet, 250 ms after a hash change, 200 ms after a click. The re-score race CI caught on 6 Nov (item 128) was one of these: a fixed 700 ms against a 700 ms animation that started late.
**Suggestion:** one `settled(page)` helper that waits for `document.getAnimations()` to finish and for the next frame. Replace the sleeps that guard animations; keep only those that wait for a timer in the app itself.
**Impact:** Medium; effort M (each sleep needs reading). It would touch most of `smoke.js`, so it is a pass of its own.

### 5. The device and engine matrix is defined in four places
**Signal:** duplicated configuration.
**Evidence:**
- `SMOKE_DEVICE` / `SMOKE_BROWSER` in `smoke.js`;
- `MONKEY_PROFILES` in `monkey.js`;
- the device list in `tests/preflight.js`;
- the CI matrix in `.github/workflows/webkit.yml`.

`ui-frames.js` and `demo-record.js` hard-code 390 × 844.
**Suggestion:** one exported list of profiles (name, viewport or Playwright device, engine) that the scripts read; CI keeps its matrix but takes the names from the same list.
**Impact:** Low; effort S.

### 6. The Playwright set-up is repeated in three workflows
**Signal:** duplicated CI steps.
**Evidence:**
- `PLAYWRIGHT_VERSION: 1.63.0` and the install/cache steps appear in `check.yml` (smoke), `webkit.yml` and three jobs of `post-deploy.yml`.
- `check.yml` still uses `@v4` tags, which run on the deprecated Node 20 runtime (runner warning since September 2025). The new workflows pin commit SHAs.

**Suggestion:** a local composite action `.github/actions/playwright` (version, cache, install, system libraries) used by every job. Pin `check.yml`'s actions to SHAs in the same pull request.
**Impact:** Low–Medium; effort S. It changes a required workflow, so it should go in its own pull request.

## Chosen for this pass

**Item 1 (with 2).** It addresses all three symptoms (the crash that hid other sections, the hang, and the unnamed failure) at the single point where they come from, and it touches no app code. Item 3 would only add a second guard behind it.

**Automatic retries were considered and rejected.** A retry would have made the iPhone SE rerun of 6 Nov invisible. Two failures of that class were real: the re-score race (item 128) and the overflowing button found in this pass (item 148). A section that crashes is reported with its step, and a person decides whether to rerun it.
