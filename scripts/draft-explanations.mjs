/**
 * scripts/draft-explanations.mjs
 *
 * Generates draft explanations from question, options, and correct answer.
 * Writes to a dedicated review file (JSON and Markdown) rather than directly
 * into questions.json, satisfying the human-review requirement before merge.
 *
 * ⚠️ Review requirement:
 * Drafts must be human-reviewed before merge. This is driving-test material:
 * a confidently wrong explanation teaches a real person to drive incorrectly.
 * Machine-generated Kinyarwanda in particular needs a native speaker's pass.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const questionsPath = path.join(root, 'questions.json');
const signsPath = path.join(root, 'src', 'data', 'signs.json');

const DEFAULT_JSON_OUTPUT = path.join(root, 'draft-explanations-review.json');
const DEFAULT_MD_OUTPUT = path.join(root, 'draft-explanations-review.md');

function cleanText(str) {
  return (str || '').trim();
}

function cleanAnswer(ans) {
  return cleanText(ans).replace(/\.$/, '');
}

/**
 * Loads sign data lookup for context-aware explanations
 */
function loadSignsLookup() {
  const signByQId = new Map();
  if (fs.existsSync(signsPath)) {
    try {
      const signsData = JSON.parse(fs.readFileSync(signsPath, 'utf8'));
      for (const sign of signsData.signs || []) {
        if (sign.source_question_id) {
          signByQId.set(sign.source_question_id, sign);
        }
        for (const qid of sign.questionIds || []) {
          signByQId.set(qid, sign);
        }
      }
    } catch {
      // Optional enhancement, fall back gracefully
    }
  }
  return signByQId;
}

/**
 * Generates trilingual 2-4 sentence draft explanation for a question
 */
export function generateDraftExplanation(q, signLookup = new Map()) {
  const qId = q.id;
  const catId = q.category_id;
  const sign = signLookup.get(qId);

  const enAns = cleanAnswer(
    q.translations?.en?.correct_answer ||
      q.translations?.en?.options?.[q.correct_index],
  );
  const frAns = cleanAnswer(
    q.translations?.fr?.correct_answer ||
      q.translations?.fr?.options?.[q.correct_index],
  );
  const rwAns = cleanAnswer(
    q.translations?.rw?.correct_answer ||
      q.translations?.rw?.options?.[q.correct_index],
  );

  const enQ = cleanText(q.translations?.en?.question).replace(/\?$/, '');
  const frQ = cleanText(q.translations?.fr?.question).replace(/\?$/, '');
  const rwQ = cleanText(q.translations?.rw?.question).replace(/\?$/, '');

  // 1. If detailed road sign knowledge is available
  if (sign && sign.meaning && sign.action) {
    const enMeaning =
      cleanText(sign.meaning.en) || `the sign designating "${enAns}"`;
    const frMeaning =
      cleanText(sign.meaning.fr) || `le panneau indiquant « ${frAns} »`;
    const rwMeaning =
      cleanText(sign.meaning.rw) || `icyapa gisobanura "${rwAns}"`;

    const enAction =
      cleanText(sign.action.en) ||
      `Drivers observing this sign must strictly comply with this regulation on Rwandan roads.`;
    const frAction =
      cleanText(sign.action.fr) ||
      `Les usagers rencontrant ce panneau doivent respecter scrupuleusement cette prescription du code de la route rwandais.`;
    const rwAction =
      cleanText(sign.action.rw) ||
      `Abashoferi babona iki cyapa bagomba kubahiriza aya mabwiriza hakurikijwe amategeko y’umuhanda mu Rwanda.`;

    return {
      en: `${enMeaning}. Official rule: ${enAction} This regulation is enforced under the Rwandan Highway Code to ensure visibility, right-of-way, and accident prevention.`,
      fr: `${frMeaning}. Règle officielle : ${frAction} Cette règle est prescrite par le code de la route rwandais pour garantir la visibilité, la priorité et la prévention des accidents.`,
      rw: `${rwMeaning}. Amabwiriza : ${rwAction} Iri tegeko rikurikizwa hakurikijwe amategeko y’umuhanda mu Rwanda kugira ngo habeho ituze, uburenganzira bwo gutambuka no gukumira impanuka.`,
    };
  }

  // 2. Category 2: Road Signs & Markings fallback
  if (catId === 2) {
    return {
      en: `For the question "${enQ}", the applicable road sign rule designates "${enAns}". Under the Rwandan Highway Code, this sign governs mandatory driving maneuvers, hazard warnings, or right-of-way permissions to ensure collision-free traffic flow. Drivers must adjust speed and proceed according to the indicated signal.`,
      fr: `Pour la question « ${frQ} », la signalisation applicable prescrit « ${frAns} ». Selon le code de la route rwandais, ce panneau impose une manœuvre obligatoire, un avertissement de danger ou une priorité indispensable pour éviter les collisions. Les conducteurs doivent adapter leur allure et respecter la directive affichée.`,
      rw: `Ku kibazo kigira giti "${rwQ}", amategeko y’icyapa asaba ko hakurikizwa "${rwAns}". Mu mategeko y’umuhanda mu Rwanda, iki cyapa kigena amabwiriza ategetswe, integuza y’impanuka cyangwa uburenganzira bwo gutambuka kugira ngo ibinyabiziga bigende mu mutekano. Abashoferi basabwa kugabanya umuvuduko no kuyoborwa n’icyo cyapa.`,
    };
  }

  // 3. Category 1: Traffic Rules & Regulations
  return {
    en: `Regarding the legal requirement for "${enQ}", the official traffic rule mandates "${enAns}". Under Rwandan traffic regulations (Presidential Decree No. 85/01 governing road circulation), this statutory standard establishes specific driver obligations, speed controls, lighting, or lane positioning. Compliance is mandatory for all road users to maintain traffic safety.`,
    fr: `Concernant la prescription légale relative à « ${frQ} », la règle de circulation officielle prescrit « ${frAns} ». Conformément au code de la route rwandais (décret présidentiel n° 85/01 portant réglementation générale de la police du roulage), cette norme statutaire fixe les obligations spécifiques de conduite, limitation de vitesse, éclairage ou position sur chaussée. Son respect est obligatoire pour assurer la sécurité routière.`,
    rw: `Kuri iri tegeko rigenga "${rwQ}", amabwiriza nyakuri y’umuhanda ategeka ko hakurikizwa "${rwAns}". Hakurikijwe amategeko agenga uburyo bwo kugenda mu muhanda mu Rwanda (Iteka rya Perezida No 85/01), iri tegeko rishyiraho ibisabwa by’umwihariko ku mikoreshereze y’umuhanda, umuvuduko, amatara cyangwa igice cy’umuhanda kigenderwamo. Abakoresha umuhanda bose bategetswe kubahiriza aya mabwiriza.`,
  };
}

/**
 * Generates a human-friendly Markdown review report
 */
function generateMarkdownReview(draftEntries) {
  let md = `# Draft Question Explanations — Review Document\n\n`;
  md += `> [!WARNING]\n`;
  md += `> **Human Review Required Before Merge**\n`;
  md += `> Driving-test material directly influences real-world safety. A confidently wrong explanation teaches a real person to drive incorrectly.\n`;
  md += `> Machine-generated Kinyarwanda in particular needs a native speaker's pass — awkward or wrong rw copy will undermine credibility.\n\n`;
  md += `**Total Questions in Review:** ${draftEntries.length}\n\n`;
  md += `---\n\n`;

  draftEntries.forEach((entry) => {
    md += `## Question #${entry.question_number} (Category: ${entry.category_name})\n\n`;
    md += `- **ID:** \`${entry.id}\`\n`;
    md += `- **Status:** \`${entry.status}\`\n`;
    md += `- [ ] **Verified by reviewer (Native Speaker & Traffic Code pass)**\n\n`;

    md += `### English (en)\n`;
    md += `**Q:** ${entry.question.en}\n\n`;
    md += `**Correct Answer:** ${entry.correct_answer.en}\n\n`;
    md += `**Draft Explanation:**\n> ${entry.draft_explanation.en}\n\n`;

    md += `### Français (fr)\n`;
    md += `**Q:** ${entry.question.fr}\n\n`;
    md += `**Bonne réponse :** ${entry.correct_answer.fr}\n\n`;
    md += `**Projet d'explication :**\n> ${entry.draft_explanation.fr}\n\n`;

    md += `### Kinyarwanda (rw)\n`;
    md += `**Ikibazo :** ${entry.question.rw}\n\n`;
    md += `**Igisubizo cy'ukuri :** ${entry.correct_answer.rw}\n\n`;
    md += `**Incamake y'ibisobanuro :**\n> ${entry.draft_explanation.rw}\n\n`;

    md += `---\n\n`;
  });

  return md;
}

export function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/draft-explanations.mjs [options]

Generates draft explanations from question, options, and correct answer,
writing to a review file rather than directly modifying questions.json.

Options:
  --output <file>     Path to output JSON review file (default: draft-explanations-review.json)
  --md-output <file>  Path to output Markdown review file (default: draft-explanations-review.md)
  --limit <number>    Limit number of questions to draft (default: all)
  --help, -h          Show this help message
`);
    return;
  }

  const outIndex = args.indexOf('--output');
  const jsonOutputPath =
    outIndex !== -1 && args[outIndex + 1]
      ? path.resolve(root, args[outIndex + 1])
      : DEFAULT_JSON_OUTPUT;

  const mdOutIndex = args.indexOf('--md-output');
  const mdOutputPath =
    mdOutIndex !== -1 && args[mdOutIndex + 1]
      ? path.resolve(root, args[mdOutIndex + 1])
      : DEFAULT_MD_OUTPUT;

  const limitIndex = args.indexOf('--limit');
  const limit =
    limitIndex !== -1 && args[limitIndex + 1]
      ? Number.parseInt(args[limitIndex + 1], 10)
      : null;

  console.log('======================================================');
  console.log('--- Generating Draft Explanations for Human Review ---');
  console.log('======================================================\n');

  if (!fs.existsSync(questionsPath)) {
    console.error(`[ERROR] questions.json not found at ${questionsPath}`);
    process.exit(1);
  }

  const questionBank = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const signLookup = loadSignsLookup();

  const questions = Array.isArray(questionBank.questions)
    ? questionBank.questions
    : [];
  const targetQuestions =
    typeof limit === 'number' && limit > 0
      ? questions.slice(0, limit)
      : questions;

  const draftEntries = targetQuestions.map((q, idx) => {
    const draft = generateDraftExplanation(q, signLookup);

    return {
      id: q.id,
      question_number: idx + 1,
      category_id: q.category_id,
      category_name: q.category_name,
      question: {
        rw: cleanText(q.translations?.rw?.question),
        en: cleanText(q.translations?.en?.question),
        fr: cleanText(q.translations?.fr?.question),
      },
      options: {
        rw: q.translations?.rw?.options || [],
        en: q.translations?.en?.options || [],
        fr: q.translations?.fr?.options || [],
      },
      correct_answer: {
        rw: cleanAnswer(
          q.translations?.rw?.correct_answer ||
            q.translations?.rw?.options?.[q.correct_index],
        ),
        en: cleanAnswer(
          q.translations?.en?.correct_answer ||
            q.translations?.en?.options?.[q.correct_index],
        ),
        fr: cleanAnswer(
          q.translations?.fr?.correct_answer ||
            q.translations?.fr?.options?.[q.correct_index],
        ),
      },
      draft_explanation: draft,
      status: 'pending_human_review',
      reviewed_by: null,
      review_notes: '',
    };
  });

  const payload = {
    metadata: {
      generated_at: new Date().toISOString(),
      source_file: 'questions.json',
      total_drafts: draftEntries.length,
      warning:
        '⚠️ REVIEW REQUIREMENT: Drafts must be human-reviewed before merge. Driving-test material teaches real drivers. Kinyarwanda requires native-speaker verification.',
    },
    drafts: draftEntries,
  };

  // Write JSON review file
  fs.writeFileSync(
    jsonOutputPath,
    JSON.stringify(payload, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `✔ JSON review file written to: ${path.relative(root, jsonOutputPath)}`,
  );

  // Write Markdown review file
  const mdContent = generateMarkdownReview(draftEntries);
  fs.writeFileSync(mdOutputPath, mdContent, 'utf8');
  console.log(
    `✔ Markdown review file written to: ${path.relative(root, mdOutputPath)}`,
  );

  console.log(`\n======================================================`);
  console.log(`✔ Generated ${draftEntries.length} draft explanations.`);
  console.log(`⚠️  NOTE: questions.json was NOT modified.`);
  console.log(`   Review files must be reviewed by humans before merging!`);
  console.log(`======================================================\n`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main();
}
