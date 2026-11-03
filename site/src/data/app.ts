// The website runs the app's real engine on the app's fictional data (both copied verbatim by scripts/sync-shared.mjs).
import Engine from '@/generated/engine.cjs';
import DEMO from '@/generated/data.cjs';
import type { Overrides, Profile, Result, Tender, Verdict } from './types';

export { Engine, DEMO };
export type { Tender, Profile, Result, Verdict, Overrides };

export const TODAY = DEMO.DEMO_TODAY; // the fixed demo date (Thu 5 Nov 2026), so the numbers match the app
export const PROFILE = DEMO.PROFILE;
export const TENDERS = DEMO.TENDERS;
export const PAGES_TOTAL = TENDERS.reduce((s, t) => s + t.pages, 0); // 777
export const LANGUAGES = Array.from(new Set(TENDERS.map((t) => t.language))); // de, es, nl, fr
export const COUNTRIES = Array.from(new Set(TENDERS.map((t) => t.country)));
export const SECTORS = DEMO.SECTORS.map(([code, name]) => ({ code, name }));
export const OWN_SECTORS = new Set(PROFILE.cpv);

export const bare = (name: string) => name.replace(/\s*\(fictional\)/, '');
export const money = (n: number) => '€' + Engine.fmt(n);
export const VERDICT_LABEL = Engine.VERDICT_LABEL;

export interface TenderView {
  id: string;
  title: string;
  buyer: string;
  country: string;
  language: string;
  value: number;
  pages: number;
  deadline: string;
  photo: string | null;
  doc: string;
  score: number;
  verdict: Verdict;
  daysLeft: number;
  why: string;
  headline: string;
  result: Result;
  tender: Tender;
}

export function profileWith(patch: Partial<Profile>): Profile {
  return { ...PROFILE, ...patch };
}
export function withCert(profile: Profile, cert: string, on: boolean): Profile {
  const has = profile.certifications.includes(cert);
  if (on === has) return profile;
  return { ...profile, certifications: on ? [...profile.certifications, cert] : profile.certifications.filter((c) => c !== cert) };
}

const byId = new Map(TENDERS.map((t) => [t.id, t] as const));
export const tenderById = (id: string) => byId.get(id);

/** Every tender, ranked by the engine (go → maybe → no-go → closed, then score, then days left). */
export function evaluateAll(profile: Profile = PROFILE, overrides: Overrides = {}): TenderView[] {
  return Engine.rank(TENDERS, profile, TODAY, overrides).map((r) => view(r, profile));
}
export function evaluateOne(id: string, profile: Profile = PROFILE, overrides: Overrides = {}): TenderView {
  const t = byId.get(id);
  if (!t) throw new Error('unknown tender ' + id);
  return view(Engine.evaluate(t, profile, TODAY, overrides[id]), profile);
}
function view(r: Result, profile: Profile): TenderView {
  const t = byId.get(r.tenderId)!;
  return {
    id: t.id, title: t.title, buyer: bare(t.buyer), country: t.country, language: t.language, value: t.value, pages: t.pages, deadline: t.deadline,
    photo: t.photo ? '/assets/' + t.photo + '.jpg' : null, doc: t.doc || 'Tender documents',
    score: r.score, verdict: r.verdict, daysLeft: r.daysLeft,
    why: Engine.reasonLine(t, profile, r), headline: Engine.headline(t, profile, r), result: r, tender: t,
  };
}
export function counts(views: TenderView[]) {
  const c = { go: 0, maybe: 0, nogo: 0, closed: 0 };
  views.forEach((v) => { c[v.verdict]++; });
  return c;
}
export const OPEN_COUNT = evaluateAll().filter((v) => v.verdict !== 'closed').length; // 6 new tenders tonight
