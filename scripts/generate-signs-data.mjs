/**
 * Seeds src/data/signs.json from Road Signs questions (category_id = 2).
 * Deduplicates by normalized English sign name (not by image file).
 * Run: node scripts/generate-signs-data.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const bank = JSON.parse(
  fs.readFileSync(path.join(root, 'questions.json'), 'utf8'),
);

const idToNumber = new Map(bank.questions.map((x, i) => [x.id, i + 1]));

function ans(x, lang) {
  const t = x.translations[lang];
  return (t?.correct_answer || t?.options?.[x.correct_index] || '').trim();
}

function isMeaning(x) {
  const en = (x.translations.en.question || '').toLowerCase();
  const fr = (x.translations.fr.question || '').toLowerCase();
  return (
    /what does this (sign|road marking)|this signal means|road marking mean|sign mean at|these road markings mean|this sign indicates|this signaling|this road sign means/i.test(
      en,
    ) ||
    /que signifie|ce panneau|ce signal signifie|ce marquage|cette signalisation/i.test(
      fr,
    )
  );
}

function isJunkName(name) {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  // Standalone "No" / "Yes" only — keep "No entry", "No left turn", etc.
  if (/^(no|yes|b|a|c|d|driver)$/i.test(n)) return true;
  if (/^yes\b/i.test(n)) return true;
  if (/none of the answers/i.test(n)) return true;
  if (/^\d+(\.\d+)?\s*(km\/h|m|meters|metres)?$/i.test(n)) return true;
  if (n.length > 90) return true;
  if (n.length < 4) return true;
  if (
    /correct position|may overtake|should you|cannot see|proceed, as|does not concern|allow the cyclist|allow the pedestrian|both cars|be prepared|be ready to stop|driver field|you.ve broken|silver car|harnessed|it is allowed|then, i can|then i can|mark a timeout|slow down and beckon|stop if your exit|i can overtake|i cannot continue|in every turn|before each turn|just right of the center/i.test(
      n,
    )
  ) {
    return true;
  }
  return false;
}

function slugify(text) {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'sign'
  );
}

function classify(name, question) {
  const n = name.toLowerCase();
  const qtext = (question.translations.en.question || '').toLowerCase();
  const hay = `${n} ${qtext}`;
  if (/marking|white line|broken white|zebra|road marking/i.test(hay)) {
    return 'marking';
  }
  if (
    /no entry|no left|no right|no parking|prohibited|prohibition|forbidden|stop your|stop line|yield|give way|maximum speed|must not cross|parking prohibited|no through|end of a highway/i.test(
      n,
    )
  ) {
    return 'prohibitory';
  }
  if (
    /turn right only|turn left only|straight ahead only|compulsory|mandatory|roundabout$|shared cycle|minimum speed/i.test(
      n,
    )
  ) {
    return 'mandatory';
  }
  if (
    /two[- ]way|danger|slippery|steep|slope|corner|narrowing|level crossing|undefined danger|junction with|climb|climp/i.test(
      n,
    )
  ) {
    return 'warning';
  }
  return 'information';
}

/**
 * Explicit allowlist of identified road-sign name patterns.
 * Scenario / action answers are rejected unless they match these.
 */
function looksLikeSignName(name) {
  const n = name.trim();
  if (isJunkName(n)) return false;
  if (/^the signal [a-z0-9]+/i.test(n)) return true;
  return /^(no entry|no left turn|no right turn|no parking|no through|no vehicular|yield|stop your vehicle|stop line|maximum speed|minimum speed|end of a highway|end of|two[- ]way traffic|parking prohibited|roundabout|slippery road|steep (climb|climp)|dangerous slope|level crossing|shared cycle|junction with|narrowing road|right of way|turn (left|right) only|straight ahead only|give way|approaching a danger|prohibition to|it[’']s forbidden|it is prohibited|a driver must not|a hospital|corner to the (left|right))/i.test(
    n,
  );
}

function titleCaseName(name) {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const ACTIONS = {
  warning: {
    en: 'Slow down, scan for the hazard, and be ready to adjust speed or position.',
    fr: 'Ralentissez, guettez le danger et préparez-vous à adapter votre vitesse ou votre trajectoire.',
    rw: 'Gabanya umuvuduko, reba icyago, kandi witegure guhindura umuvuduko cyangwa inzira.',
  },
  prohibitory: {
    en: 'Do not do what the sign forbids. Obey it until an end-of-restriction sign or the restriction clearly ends.',
    fr: 'N’effectuez pas ce que le panneau interdit. Respectez-le jusqu’à un panneau de fin d’interdiction ou la fin claire de la restriction.',
    rw: 'Ntukore icyo icyapa gibuza. Komeza ukurikize kugeza ku cyapa gisoza cyangwa igabu rirangiye.',
  },
  mandatory: {
    en: 'Follow the required direction or behaviour shown by the sign.',
    fr: 'Suivez la direction ou le comportement imposé par le panneau.',
    rw: 'Kurikiza icyerekezo cyangwa imyitwarire icyapa gitegeka.',
  },
  information: {
    en: 'Use the information to plan your route and driving, without treating it as a prohibition unless stated.',
    fr: 'Utilisez cette information pour anticiper votre trajet, sans la traiter comme une interdiction sauf mention contraire.',
    rw: 'Koresha aya makuru mu gutegura urugendo, ntuyafate nk’igabu keretse byavuze.',
  },
  marking: {
    en: 'Stay within the rules shown by the road marking — do not cross solid lines and give way where markings require it.',
    fr: 'Respectez le marquage au sol : ne franchissez pas les lignes continues et cédez le passage lorsque le marquage l’exige.',
    rw: 'Kurikiza amabwiriza y’ibimenyetso ku muhanda — ntukambuke imirongo ihamye kandi uha uburenganzira aho bisabwa.',
  },
};

const cat2 = bank.questions.filter((x) => x.category_id === 2 && x.image_url);
/** @type {Map<string, object>} */
const byDedupe = new Map();
const usedSlugs = new Set();

function uniqueSlug(base) {
  let s = base || 'sign';
  let i = 2;
  while (usedSlugs.has(s)) {
    s = `${base}-${i}`;
    i += 1;
  }
  usedSlugs.add(s);
  return s;
}

for (const x of cat2) {
  let nameEn = ans(x, 'en');
  let nameFr = ans(x, 'fr');
  let nameRw = ans(x, 'rw');
  const meaningQ = isMeaning(x);

  if (isJunkName(nameEn) || !looksLikeSignName(nameEn)) continue;

  nameEn = titleCaseName(nameEn);
  nameFr = titleCaseName(nameFr);
  nameRw = titleCaseName(nameRw);

  const dedupeKey = slugify(nameEn);
  const questionNumber = idToNumber.get(x.id);
  const localizedNames = { en: nameEn, fr: nameFr, rw: nameRw };

  if (byDedupe.has(dedupeKey)) {
    const existing = byDedupe.get(dedupeKey);
    if (!existing.questionIds.includes(x.id)) {
      existing.questionIds.push(x.id);
      existing.questionNumbers.push(questionNumber);
    }
    if (meaningQ && !existing._primaryIsMeaning) {
      existing.image_url = x.image_url;
      existing.source_question_id = x.id;
      existing._primaryIsMeaning = true;
      existing.names = localizedNames;
      existing.meaning = { ...localizedNames };
    }
    continue;
  }

  const slug = uniqueSlug(dedupeKey);
  byDedupe.set(dedupeKey, {
    id: slug,
    slug,
    type: classify(nameEn, x),
    image_url: x.image_url,
    source_question_id: x.id,
    _primaryIsMeaning: meaningQ,
    names: localizedNames,
    // Always use localized answer names (never the question prompt).
    meaning: { ...localizedNames },
    action: ACTIONS.information,
    questionIds: [x.id],
    questionNumbers: [questionNumber],
  });
}

const signs = [...byDedupe.values()]
  .map((entry) => {
    const action = ACTIONS[entry.type] || ACTIONS.information;
    const { _primaryIsMeaning, ...rest } = entry;
    void _primaryIsMeaning;
    rest.meaning = { ...rest.names };
    rest.action = action;
    rest.questionNumbers = [...rest.questionNumbers].sort((a, b) => a - b);
    return rest;
  })
  .sort((a, b) => a.names.en.localeCompare(b.names.en));

const outPath = path.join(root, 'src', 'data', 'signs.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: 'Seeded from category_id=2 questions. Review names/types; dedupe key is EN name slug.',
      signs,
    },
    null,
    2,
  ) + '\n',
);

const byType = Object.create(null);
for (const s of signs) byType[s.type] = (byType[s.type] || 0) + 1;
console.log(`Wrote ${signs.length} signs → ${outPath}`);
console.log(byType);
console.log(
  'minimum-speed:',
  signs
    .filter((s) => /minimum speed/i.test(s.names.en))
    .map((s) => `${s.slug} → ${s.type}`),
);
