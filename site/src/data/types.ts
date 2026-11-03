// Shapes of the app's data.js and engine.js (see ../../engine.js for the rules; the engine is real code, the data is fictional).
export type Verdict = 'go' | 'maybe' | 'nogo' | 'closed';
export type Status = 'pass' | 'risk' | 'fail' | 'review';

export interface Requirement {
  id: string;
  type: 'min_turnover' | 'certification' | 'min_references' | 'language' | 'region' | 'site_visit' | 'other';
  value?: string | number;
  label: string;
  cite: string;
  confidence: number;
  highlight?: string;
  subcontractAllowed?: boolean;
  note?: string;
  src: string;
  tr: string;
}
export interface Tender {
  id: string;
  title: string;
  original: string;
  buyer: string;
  country: string;
  language: string;
  value: number;
  deadline: string;
  cpv: string[];
  pages: number;
  doc?: string;
  photo?: string;
  requirements: Requirement[];
  ai: { summary: string; qa: { q: string; a: string }[] };
}
export interface Profile {
  name: string;
  city: string;
  staff: number;
  turnover: number;
  references: number;
  certifications: string[];
  cpv: string[];
  sectorsLabel: string[];
  countries: string[];
  crossBorder: boolean;
  languages: string[];
  minValue: number;
  maxValue: number;
}
export interface Demo {
  DEMO_TODAY: string;
  PROFILE: Profile;
  TENDERS: Tender[];
  CERT_OPTIONS: string[];
  SECTORS: [string, string][];
}
export interface Check { id: string; label: string; cite: string; confidence: number; type: string; status: Status; note: string; confirmed?: boolean }
export interface Result {
  tenderId: string;
  score: number;
  verdict: Verdict;
  reason: string;
  checks: Check[];
  count: Record<Status, number>;
  daysLeft: number;
  effortHours: number;
}
export type Overrides = Record<string, Record<string, 'pass' | 'fail'>>;
export interface EngineApi {
  evaluate(tender: Tender, profile: Profile, today: string, overrides?: Record<string, 'pass' | 'fail'>): Result;
  rank(tenders: Tender[], profile: Profile, today: string, overrides?: Overrides): Result[];
  reasonLine(tender: Tender, profile: Profile, result: Result): string;
  headline(tender: Tender, profile: Profile, result: Result): string;
  verdicts(tenders: Tender[], profile: Profile, today: string, overrides?: Overrides): Record<string, { verdict: Verdict; score: number }>;
  diff(before: Record<string, { verdict: Verdict; score: number }>, after: Record<string, { verdict: Verdict; score: number }>): { tenderId: string; from: Verdict; to: Verdict; fromScore: number; toScore: number; direction: 'up' | 'down' }[];
  whatIf(tenders: Tender[], profile: Profile, today: string, overrides: Overrides | undefined, patch: Partial<Profile>): ReturnType<EngineApi['diff']>;
  fmt(n: number): string;
  langName(code: string): string;
  countryName(code: string): string;
  shortDate(iso: string): string;
  VERDICT_LABEL: Record<Verdict, string>;
  REVIEW_THRESHOLD: number;
  KNOCKOUT_CAP: number;
}
