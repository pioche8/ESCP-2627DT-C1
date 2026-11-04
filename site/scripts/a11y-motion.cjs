// site/scripts/a11y-motion.cjs — reduced-motion and keyboard checks for the site (dev-only; Playwright is pre-installed).
//   SITE_URL=http://localhost:3100 node scripts/a11y-motion.cjs
const { chromium } = require('playwright');
const SITE = process.env.SITE_URL || 'http://localhost:3100';
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };
(async () => {
  const browser = await chromium.launch();
  // 1. prefers-reduced-motion: no count-ups, instant reveals, no running animations
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.locator('#how').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  ok((await page.locator('.counter-num').innerText()) === '777', 'reduced motion: the 777 counter shows its final value at once');
  await page.locator('#statement').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  const lit = await page.evaluate(() => [document.querySelectorAll('.reveal span.lit').length, document.querySelectorAll('.reveal span').length]);
  ok(lit[0] === lit[1], `reduced motion: statement fully lit at once (${lit[0]}/${lit[1]})`);
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => (a.effect.getComputedTiming().duration || 0) > 0).length);
  ok(anims === 0, `reduced motion: no running CSS animations (${anims})`);
  await ctx.close();
  // 2. keyboard: menu opens, traps focus, Escape closes and returns focus; the phone's tabs take arrow keys; the map switch re-scores
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(SITE, { waitUntil: 'networkidle' });
  await p2.focus('.menu-btn'); await p2.keyboard.press('Enter'); await p2.waitForTimeout(900);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-close')), 'menu: focus moves to Close');
  for (let i = 0; i < 9; i++) await p2.keyboard.press('Tab');
  ok(await p2.evaluate(() => !!document.activeElement?.closest('#site-menu')), 'menu: Tab stays inside the dialog');
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(850);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-btn')), 'menu: Escape returns focus to the Menu button');
  await p2.locator('#app').scrollIntoViewIfNeeded();
  await p2.focus('[role="tab"][aria-selected="true"]'); await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(100);
  ok((await p2.locator('[role="tab"][aria-selected="true"]').innerText()).includes('Company'), 'phone tab bar: ArrowRight moves to Company');
  await p2.locator('.pswitch[aria-checked]').nth(1).focus(); await p2.keyboard.press('Space'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Maybe, score 90'), 'phone: ISO 27001 by keyboard → Landkreis Hohenau: Maybe 90 (' + (await p2.locator('.pblock').getAttribute('aria-label')) + ')');
  await p2.locator('.meet-btn').focus(); await p2.keyboard.press('Enter'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Go, score 100'), 'phone: "We meet it" → Go 100');
  await p2.locator('#where').scrollIntoViewIfNeeded(); await p2.waitForTimeout(400);
  const before = (await p2.locator('.map-counts').innerText()).replace(/\s+/g, ' ');
  await p2.locator('.map-row').click(); await p2.waitForTimeout(300);
  const after = (await p2.locator('.map-counts').innerText()).replace(/\s+/g, ' ');
  ok(before !== after && after.includes('No-go'), 'map: cross-border switch re-scores (' + before + ' → ' + after + ')');
  await ctx2.close();
  await browser.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site motion + keyboard checks passed'));
  process.exitCode = failures ? 1 : 0;
})();
