import fs from 'fs';

const bank = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

/** @param {any} q */
function classify(q) {
  const en = (q.translations?.en?.question || '').replace(/\s+/g, ' ').trim();
  const hasImg = !!q.image_url;

  // Strong Road Signs signals
  if (/what does this sign mean/i.test(en)) return 2;
  if (/what does this road marking mean/i.test(en)) return 2;
  if (/what do these road markings mean/i.test(en)) return 2;
  if (
    /^this signal (means|indicates|explains|designates|showing|prohibits|prevents)/i.test(
      en,
    )
  )
    return 2;
  if (/^this sign (indicates|showing|means)/i.test(en)) return 2;
  if (/^this signaling/i.test(en)) return 2;
  if (/^these road signs/i.test(en)) return 2;
  if (/which sign (means|shows)/i.test(en)) return 2;
  if (/triangular shape road signs/i.test(en)) return 2;
  if (/road signs have similar designs/i.test(en)) return 2;
  if (/danger (and priority )?road signs/i.test(en)) return 2;
  if (/danger and priority signals are constituted/i.test(en)) return 2;
  if (/additional signals may notify/i.test(en)) return 2;
  if (/the signal \(path for cattle/i.test(en)) return 2;
  if (/the signal c\d+/i.test(en)) return 2;
  if (/the form of a signal which means/i.test(en)) return 2;
  if (/the two-way traffic sign/i.test(en)) return 2;
  if (/a signal indicating the mandatory direction/i.test(en)) return 2;
  if (/prohibition and obligation signs/i.test(en)) return 2;
  if (/the sign which indicates the right of way/i.test(en)) return 2;
  if (/what signal (obliges|gives you priority)/i.test(en)) return 2;
  if (/beyond the first road sign/i.test(en)) return 2;
  if (/from these road signs/i.test(en)) return 2;
  if (
    /outside an agglomeration, you first encounter the two left-hand signals/i.test(
      en,
    )
  )
    return 2;
  if (/this road sign means/i.test(en)) return 2;
  if (/what does a (green|red|yellow) (traffic )?light mean/i.test(en))
    return 2;
  if (/what does a continuous white line/i.test(en)) return 2;
  if (/what does this broken white line mean/i.test(en)) return 2;
  if (/the two parallel discontinuous lines/i.test(en)) return 2;
  if (/railroad crossing/i.test(en) && hasImg) return 2;
  if (/at this junction.*stop.?sign/i.test(en)) return 2;
  if (
    /which sign shows the driver who is about to enter a narrow road/i.test(en)
  )
    return 2;
  if (/which sign shows no through road/i.test(en)) return 2;
  if (/a tanker is involved.*which sign/i.test(en)) return 2;
  if (/which sign means a one-way/i.test(en)) return 2;
  if (/wide and continuous white line may be drawn/i.test(en)) return 2;
  if (/broken line which announces the approach of a continuous line/i.test(en))
    return 2;
  if (/delineated by two broken and parallel white lines/i.test(en)) return 2;
  if (/traffic deviation is required, it is signaled/i.test(en)) return 2;

  // Everything else = Traffic Rules (equipment, speeds, situations, priority, etc.)
  return 1;
}

const names = { 1: 'Traffic Rules', 2: 'Road Signs' };
const changes = [];

for (let i = 0; i < bank.questions.length; i++) {
  const q = bank.questions[i];
  const next = classify(q);
  if (q.category_id !== next) {
    changes.push({
      n: i + 1,
      from: q.category_id,
      to: next,
      img: !!q.image_url,
      q: (q.translations.en.question || '').replace(/\s+/g, ' ').slice(0, 85),
    });
  }
  q.category_id = next;
  q.category_name = names[next];
}

const c1 = bank.questions.filter((q) => q.category_id === 1).length;
const c2 = bank.questions.filter((q) => q.category_id === 2).length;
console.log('Totals: Traffic Rules', c1, '| Road Signs', c2);
console.log('Changes:', changes.length);
for (const c of changes) {
  console.log(
    `${String(c.n).padStart(3)} ${c.from}->${c.to} ${c.img ? 'I' : '-'} ${c.q}`,
  );
}

const PAGE = 20;
console.log('\nPer-page (TR / RS):');
for (let p = 1; p <= Math.ceil(bank.questions.length / PAGE); p++) {
  const s = (p - 1) * PAGE;
  const slice = bank.questions.slice(s, s + PAGE);
  const tr = slice.filter((q) => q.category_id === 1).length;
  const rs = slice.filter((q) => q.category_id === 2).length;
  console.log(`page ${p}: TR ${tr}  RS ${rs}`);
}

// Spot-check: remaining category 2 that might be wrong (situational)
console.log('\nRoad Signs sample (should be sign/marking meaning):');
bank.questions.forEach((q, i) => {
  if (q.category_id !== 2) return;
  const t = (q.translations.en.question || '')
    .replace(/\s+/g, ' ')
    .slice(0, 90);
  console.log(String(i + 1).padStart(3), t);
});

fs.writeFileSync('questions.json', JSON.stringify(bank, null, 2) + '\n');
console.log('\nSaved.');
