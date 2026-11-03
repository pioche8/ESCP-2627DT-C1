/*
 * DEMO DATA — ALL FICTIONAL.
 * Company, buyers, tenders, page numbers and quotes are invented for the prototype.
 * They are NOT interview evidence and NOT real tenders. Replace after the interviews.
 * The "ai" blocks stand in for what a language model would extract from the tender PDF.
 * Optional display fields (added 2 Nov, ignored by engine.js): tender.doc = source document name,
 * requirement.highlight = the decisive phrase inside src, marked on the quote card.
 * tender.photo (added 3 Nov, ignored by engine.js) = file name in assets/img/ for the card band, Bids thumbnail
 * and detail header. Two tenders have no photo yet and show a document placeholder instead.
 */
(function (root) {
  'use strict';

  var DEMO_TODAY = '2026-11-05'; // fixed so the workshop demo is stable

  var PROFILE = {
    name: 'Nordlicht Netzwerk GmbH (fictional)',
    city: 'Leipzig, DE',
    staff: 24,
    turnover: 3200000,
    references: 4,
    certifications: ['ISO 9001'],
    cpv: ['32', '45', '51', '72'],    // CPV divisions: telecom equipment, construction works, installation, IT services
    sectorsLabel: ['Network cabling', 'Wi-Fi installation', 'IT support'],
    countries: ['DE', 'AT'],
    crossBorder: true,
    languages: ['de', 'en'],
    minValue: 50000,
    maxValue: 1500000
  };

  var CERT_OPTIONS = ['ISO 9001', 'ISO 27001', 'VCA', 'ISO 14001'];

  var TENDERS = [
    {
      id: 'ell-schools',
      title: 'Structured cabling and Wi-Fi for 12 primary schools',
      original: 'Strukturierte Verkabelung und WLAN für 12 Grundschulen',
      buyer: 'Stadt Ellerbach (fictional)', country: 'DE', language: 'de',
      value: 480000, deadline: '2026-12-04', cpv: ['32420000', '45314300'], pages: 146, doc: 'Vergabeunterlagen', photo: 't-schools',
      requirements: [
        { id: 'r1', type: 'min_turnover', value: 1500000, label: 'Minimum annual turnover €1.5M', cite: 'Vergabeunterlagen p. 23, §4.2', confidence: 0.96, highlight: 'mindestens 1,5 Mio. EUR',
          src: 'Der Bieter muss einen durchschnittlichen Jahresumsatz von mindestens 1,5 Mio. EUR in den letzten drei Geschäftsjahren nachweisen.',
          tr: 'The bidder must demonstrate an average annual turnover of at least EUR 1.5 million over the last three financial years.' },
        { id: 'r2', type: 'min_references', value: 3, label: '3 comparable references (last 3 years)', cite: 'p. 24, §4.3', confidence: 0.91, highlight: 'Mindestens drei vergleichbare Referenzprojekte',
          src: 'Mindestens drei vergleichbare Referenzprojekte aus den letzten drei Jahren.',
          tr: 'At least three comparable reference projects from the last three years.' },
        { id: 'r3', type: 'certification', value: 'ISO 9001', label: 'ISO 9001 quality management', cite: 'p. 25, §4.5', confidence: 0.94, highlight: 'ISO 9001',
          src: 'Nachweis eines Qualitätsmanagementsystems nach ISO 9001.', tr: 'Proof of a quality management system according to ISO 9001.' },
        { id: 'r4', type: 'language', value: 'de', label: 'Bid in German', cite: 'p. 6, §1.4', confidence: 0.99, highlight: 'in deutscher Sprache',
          src: 'Angebote sind in deutscher Sprache einzureichen.', tr: 'Bids must be submitted in German.' }
      ],
      ai: {
        summary: 'Install cat6A cabling and ~180 Wi-Fi access points across 12 schools during school holidays (Feb–Aug 2027). Price weighs 60%, technical concept 40%. Two lots; you may bid for both.',
        qa: [
          { q: 'When must the work be done?', a: 'Installation only during school holidays: Feb 2027 to Aug 2027 (p. 41, §7.1).' },
          { q: 'Is there a penalty clause?', a: 'Yes: 0.2% of the contract value per working day of delay, capped at 5% (p. 88, §12.3).' },
          { q: 'How is the bid scored?', a: 'Price 60%, technical concept 40%, with the concept judged on project plan, staffing and school safety (p. 31, §5).' }
        ]
      }
    },
    {
      id: 'hoh-security',
      title: 'IT security audit and hardening for district administration',
      original: 'IT-Sicherheitsaudit und Härtung der Kreisverwaltung',
      buyer: 'Landkreis Hohenau (fictional)', country: 'DE', language: 'de',
      value: 95000, deadline: '2026-11-27', cpv: ['72150000'], pages: 64, doc: 'Vergabeunterlagen', photo: 't-audit',
      requirements: [
        { id: 'r1', type: 'certification', value: 'ISO 27001', label: 'ISO 27001 information security', cite: 'p. 12, §3.1', confidence: 0.95, highlight: 'nach ISO/IEC 27001 zertifiziert', subcontractAllowed: false,
          src: 'Der Auftragnehmer muss nach ISO/IEC 27001 zertifiziert sein.', tr: 'The contractor must be certified to ISO/IEC 27001.' },
        { id: 'r2', type: 'min_references', value: 2, label: '2 security audit references', cite: 'p. 13, §3.2', confidence: 0.88, highlight: 'Zwei Referenzen',
          src: 'Zwei Referenzen über vergleichbare Sicherheitsaudits.', tr: 'Two references for comparable security audits.' },
        { id: 'r3', type: 'other', label: 'Staff with “comparable qualification”', cite: 'p. 14, §3.4', confidence: 0.58, highlight: 'eine vergleichbare Qualifikation',
          note: 'Wording is vague: may mean a named certificate (e.g. BSI auditor) or just experience.',
          src: 'Das eingesetzte Personal verfügt über eine vergleichbare Qualifikation.', tr: 'The deployed staff hold a comparable qualification.' }
      ],
      ai: {
        summary: 'Audit 400 workstations and 30 servers against the BSI IT-Grundschutz baseline, then fix the top findings. Runs 4 months from Jan 2027.',
        qa: [
          { q: 'Can we subcontract the audit?', a: 'No. §3.1 requires the contractor itself to be ISO 27001 certified, and subcontracting the audit is excluded (p. 12).' },
          { q: 'What does “comparable qualification” mean?', a: 'The tender does not define it. Ask the buyer before the question deadline of 18 Nov (p. 5, §1.2).' }
        ]
      }
    },
    {
      id: 'val-dc',
      title: 'Data centre cabling, lot 2 (university campus)',
      original: 'Cableado del centro de datos, lote 2',
      buyer: 'Universidad de Valdemora (fictional)', country: 'ES', language: 'es',
      value: 310000, deadline: '2026-11-14', cpv: ['45314300'], pages: 98, doc: 'Pliego', photo: 't-datacentre',
      requirements: [
        { id: 'r1', type: 'certification', value: 'ISO 9001', label: 'ISO 9001', cite: 'Pliego p. 17, cláusula 8', confidence: 0.93, highlight: 'ISO 9001 vigente',
          src: 'Certificado ISO 9001 vigente.', tr: 'Valid ISO 9001 certificate.' },
        { id: 'r2', type: 'min_references', value: 2, label: '2 data centre references', cite: 'p. 18, cláusula 9', confidence: 0.86, highlight: 'Dos trabajos de similar naturaleza',
          src: 'Dos trabajos de similar naturaleza en los últimos cinco años.', tr: 'Two works of a similar nature in the last five years.' },
        { id: 'r3', type: 'language', value: 'es', label: 'Bid in Spanish', cite: 'p. 4, cláusula 2', confidence: 0.98, highlight: 'en castellano',
          src: 'Las ofertas se presentarán en castellano.', tr: 'Bids shall be submitted in Spanish.' },
        { id: 'r4', type: 'region', value: 'ES', label: 'Work delivered in Spain', cite: 'p. 3', confidence: 0.99, highlight: 'Campus de Valdemora',
          src: 'Lugar de ejecución: Campus de Valdemora.', tr: 'Place of performance: Valdemora campus.' }
      ],
      ai: {
        summary: 'Lot 2 of 3: fibre backbone and cabling for a new 40-rack server room. Only 9 days left, and the bid must be in Spanish.',
        qa: [
          { q: 'Do we need a Spanish entity?', a: 'No. EU bidders can take part. A Spanish tax ID (NIF) is only needed after award (p. 21, cláusula 14).' }
        ]
      }
    },
    {
      id: 'kal-fibre',
      title: 'Fibre-to-the-building rollout, municipal utility',
      original: 'Glasfaser-Anbindung kommunaler Gebäude',
      buyer: 'Stadtwerke Kaltbrunn (fictional)', country: 'AT', language: 'de',
      value: 1100000, deadline: '2026-12-18', cpv: ['45231600', '32520000'], pages: 212, doc: 'Ausschreibungsunterlagen', photo: 't-fibre',
      requirements: [
        { id: 'r1', type: 'min_turnover', value: 2000000, label: 'Minimum turnover €2M', cite: 'p. 30, §5.1', confidence: 0.95, highlight: '2 Mio. EUR pro Jahr',
          src: 'Mindestumsatz von 2 Mio. EUR pro Jahr.', tr: 'Minimum turnover of EUR 2 million per year.' },
        { id: 'r2', type: 'min_references', value: 5, label: '5 fibre references', cite: 'p. 31, §5.2', confidence: 0.9, highlight: 'Fünf Referenzen',
          src: 'Fünf Referenzen über Glasfaserprojekte.', tr: 'Five references for fibre projects.' },
        { id: 'r3', type: 'site_visit', value: '20 Nov 2026, 10:00', label: 'Mandatory site visit', cite: 'p. 9, §2.6', confidence: 0.97, highlight: 'ist verpflichtend',
          src: 'Eine Begehung am 20.11.2026 um 10:00 Uhr ist verpflichtend.', tr: 'A site visit on 20 Nov 2026 at 10:00 is mandatory.' }
      ],
      ai: {
        summary: 'Connect 38 municipal buildings to the utility fibre ring. Consortium bids are explicitly allowed (§5.4).',
        qa: [
          { q: 'Can we bid as a consortium?', a: 'Yes. Bidder groups are allowed, and references can be pooled (p. 32, §5.4).' }
        ]
      }
    },
    {
      id: 'vli-libraries',
      title: 'Public Wi-Fi for 9 libraries',
      original: 'Openbare wifi voor 9 bibliotheken',
      buyer: 'Gemeente Vlietdam (fictional)', country: 'NL', language: 'nl',
      value: 220000, deadline: '2026-12-10', cpv: ['32420000'], pages: 77, doc: 'Bestek',
      requirements: [
        { id: 'r1', type: 'certification', value: 'VCA', label: 'VCA safety certificate', cite: 'Bestek p. 15, §3.3', confidence: 0.92, highlight: 'een geldig VCA-certificaat', subcontractAllowed: false,
          src: 'Inschrijver beschikt over een geldig VCA-certificaat.', tr: 'The bidder holds a valid VCA certificate.' },
        { id: 'r2', type: 'language', value: 'nl', label: 'Bid in Dutch', cite: 'p. 5', confidence: 0.97, highlight: 'in het Nederlands',
          src: 'De inschrijving wordt in het Nederlands opgesteld.', tr: 'The bid is drawn up in Dutch.' },
        { id: 'r3', type: 'region', value: 'NL', label: 'Work in the Netherlands', cite: 'p. 4', confidence: 0.99, highlight: 'Vlietdam',
          src: 'Uitvoering in Vlietdam.', tr: 'Performance in Vlietdam.' }
      ],
      ai: {
        summary: 'Supply, install and manage guest Wi-Fi in 9 libraries for 4 years. VCA (a Dutch/Belgian safety certificate) is mandatory.',
        qa: [
          { q: 'What is VCA?', a: 'A safety checklist certificate common in NL/BE for on-site contractors. Firms usually need 2–3 months to obtain it.' }
        ]
      }
    },
    {
      id: 'mor-support',
      title: 'IT support framework agreement (4 years)',
      original: 'Accord-cadre de support informatique',
      buyer: 'Centre Hospitalier de Morlanne (fictional)', country: 'FR', language: 'fr',
      value: 2400000, deadline: '2026-12-22', cpv: ['72250000'], pages: 180, doc: 'Règlement de consultation',
      requirements: [
        { id: 'r1', type: 'min_turnover', value: 5000000, label: 'Minimum turnover €5M', cite: 'RC p. 11, art. 6', confidence: 0.94, highlight: 'minimum de 5 M€',
          src: "Chiffre d'affaires annuel minimum de 5 M€.", tr: 'Minimum annual turnover of EUR 5M.' },
        { id: 'r2', type: 'language', value: 'fr', label: 'Bid in French', cite: 'RC p. 3', confidence: 0.98, highlight: 'en langue française',
          src: 'Les offres sont rédigées en langue française.', tr: 'Bids are written in French.' }
      ],
      ai: {
        summary: 'Helpdesk and on-site support for 2,000 hospital staff, 24/7 for critical systems. Too large for your current turnover.',
        qa: []
      }
    }
  ];

  root.DEMO = { DEMO_TODAY: DEMO_TODAY, PROFILE: PROFILE, TENDERS: TENDERS, CERT_OPTIONS: CERT_OPTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DEMO;
})(this);
