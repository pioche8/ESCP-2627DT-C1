'use client';
import { useState } from 'react';
import { APP_URL } from '@/data/copy';
import { LiquidMetalButton } from '@/components/ui/Buttons';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { Grain } from '@/components/ui/Grain';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/Primitives';

const VALID = /^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}$/i;

/** Website input pill with the liquid-metal "Draft my profile" button, validation message under it, blue glow behind. */
export function Start() {
  const [site, setSite] = useState('nordlicht-netzwerk.example');
  const host = site.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const valid = VALID.test(host);
  return (
    <section id="start" className="start" aria-labelledby="start-h">
      <GlowBlob gradient="core" blur={90} opacity={0.5} drift="d3" className="start-g" />
      <Grain />
      <div className="start-inner">
        <SectionLabel n="10">START</SectionLabel>
        <h2 id="start-h" className="h2-xl">Start with your website.</h2>
        <p className="body start-sub">We draft your company profile from your site, references and certificates. You check it, and the first verdicts arrive the next morning.</p>
        <div className={`site-input${valid ? '' : ' invalid'}`}>
          <Icon name="language" size={21} className="site-input-icon" />
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourcompany.eu" aria-label="Company website" autoComplete="url" autoCapitalize="off" spellCheck={false} inputMode="url" aria-describedby="site-msg" />
          <LiquidMetalButton href={APP_URL} dim={!valid} external>Draft my profile</LiquidMetalButton>
        </div>
        <p id="site-msg" className={`site-msg${valid ? ' ok' : ''}`} aria-live="polite">{valid ? `Ready to read ${host}` : 'Enter your company website'}</p>
        <p className="start-note">Opens the prototype. AI output there is simulated and the data is fictional.</p>
      </div>
    </section>
  );
}
