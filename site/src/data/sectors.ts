// The 45 EU CPV divisions come from the app (data.js → DEMO.SECTORS). The weekly open counts are ILLUSTRATIVE:
// they are not derived from data.js (which holds six tenders) and the site labels them as such.
import { OWN_SECTORS, SECTORS } from './app';

const OPEN_THIS_WEEK: Record<string, number> = {
  '03': 12, '09': 9, '14': 4, '15': 22, '16': 6, '18': 5, '19': 7, '22': 8, '24': 11, '30': 41, '31': 37, '32': 31, '33': 58, '34': 26, '35': 19,
  '37': 6, '38': 14, '39': 13, '41': 9, '42': 21, '43': 7, '44': 17, '45': 78, '48': 48, '50': 52, '51': 56, '55': 15, '60': 33, '63': 18, '64': 12,
  '65': 24, '66': 16, '70': 10, '71': 42, '72': 64, '73': 11, '75': 9, '76': 5, '77': 23, '79': 39, '80': 27, '85': 46, '90': 38, '92': 14, '98': 20,
};

export interface Sector { code: string; name: string; open: number; own: boolean; img: string }
export const sectors: Sector[] = SECTORS.map((s) => ({ code: s.code, name: s.name, open: OPEN_THIS_WEEK[s.code] ?? 0, own: OWN_SECTORS.has(s.code), img: `/assets/sectors/cpv-${s.code}.jpg` }));
export const sectorByCode = (code: string) => sectors.find((s) => s.code === code)!;
export const OPEN_COUNTS_NOTE = 'Weekly counts are illustrative';

/** The five strips of the Sectors accordion (order and copy from the handoff; counts from the table above). */
export const featuredStrips = [
  { code: '45', title: 'Construction work', desc: 'Schools, depots and public buildings.' },
  { code: '32', title: 'Telecom and fibre', desc: 'Fibre rollouts and municipal networks.' },
  { code: '72', title: 'IT services', desc: 'Data centres, support frameworks and hosting.' },
  { code: '79', title: 'Audits and security', desc: 'Security audits and certification work.' },
  { code: '51', title: 'Installation', desc: 'Cabling, Wi-Fi and electrical installation.' },
].map((s) => ({ ...s, open: OPEN_THIS_WEEK[s.code], img: `/assets/sectors/cpv-${s.code}.jpg` }));
