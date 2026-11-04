'use client';
import { useState } from 'react';
import { APP_URL } from '@/data/copy';
import { Button } from '@/components/ui/Buttons';

const VALID = /^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}$/i;

/** Website field with the "Draft my profile" button and a validation line under it. */
export function Start() {
  const [site, setSite] = useState('nordlicht-netzwerk.example');
  const host = site.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const valid = VALID.test(host);
  return (
    <section id="start" className="section" aria-labelledby="start-h">
      <div className="wrap start-inner">
        <h2 id="start-h" className="h2">Start with your website.</h2>
        <p className="body start-sub">We draft your profile from your site, references and certificates. You check it, and the first verdicts arrive the next morning.</p>
        <div className={`site-input${valid ? '' : ' invalid'}`}>
          <div className="field">
            <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourcompany.eu" aria-label="Company website" autoComplete="url" autoCapitalize="off" spellCheck={false} inputMode="url" aria-describedby="site-msg" />
          </div>
          <Button href={APP_URL} size="lg" dim={!valid} external>Draft my profile</Button>
        </div>
        <p id="site-msg" className={`site-msg${valid ? ' ok' : ''}`} aria-live="polite">{valid ? `Ready to read ${host}` : 'Enter your company website'}</p>
        <p className="start-note">Opens the prototype. AI output there is simulated and the data is fictional.</p>
      </div>
    </section>
  );
}
