'use client';
import { useState } from 'react';
import { APP_URL } from '@/data/copy';
import { Button } from '@/components/ui/Buttons';
import { Icon } from '@/components/ui/Icon';

const VALID = /^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}$/i;

/**
 * Website field with the "Draft my profile" button and a validation line under it. The original's motion in solid
 * colours (pass 5): the button's metal ring is a solid ring with a short ink sheen travelling around it (5 s a turn), and the blue glow that
 * drifted behind the section is a surface-coloured disc on the same 12 s drift. Both stop under reduced motion.
 */
export function Start() {
  const [site, setSite] = useState('nordlicht-netzwerk.example');
  const host = site.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const valid = VALID.test(host);
  return (
    <section id="start" className="section start" aria-labelledby="start-h">
      <div className="start-disc" aria-hidden="true" />
      <div className="wrap start-inner">
        <h2 id="start-h" className="h2">Start with your website.</h2>
        <p className="body start-sub">We draft your profile from your site, references and certificates. You check it, and the first verdicts arrive the next morning.</p>
        <div className={`site-input${valid ? '' : ' invalid'}`}>
          <div className="field">
            <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourcompany.eu" aria-label="Company website" autoComplete="url" autoCapitalize="off" spellCheck={false} inputMode="url" aria-describedby="site-msg" />
          </div>
          <Button href={APP_URL} size="lg" dim={!valid} external className="btn-metal">
            <span className="metal" aria-hidden="true"><svg viewBox="0 0 30 30" className="metal-ring"><circle cx="15" cy="15" r="13" /></svg><svg viewBox="0 0 30 30" className="metal-spin"><circle cx="15" cy="15" r="13" /></svg><Icon name="arrow_forward" size={16} /></span>
            Draft my profile
          </Button>
        </div>
        <p id="site-msg" className={`site-msg${valid ? ' ok' : ''}`} aria-live="polite">{valid ? `Ready to read ${host}` : 'Enter your company website'}</p>
        <p className="start-note">Opens the prototype. AI output there is simulated and the data is fictional.</p>
      </div>
    </section>
  );
}
