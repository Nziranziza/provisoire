import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import questionsBank from '../questions.json' with { type: 'json' };

const SITE = 'https://provisoire.pages.dev';

console.log('--- Verifying Structured Data Schemas & Rules ---');

/**
 * Truncates text to max length with ellipsis.
 *
 * @param {string} text - Input text to clean and truncate.
 * @param {number} [max=155] - Maximum character length.
 * @returns {string} Truncated text.
 */
function truncateMeta(text, max = 155) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Retrieves localized question text.
 *
 * @param {object} q - Question object.
 * @param {string} lang - Locale code.
 * @returns {string} Question text.
 */
function questionText(q, lang) {
  return (
    q.translations[lang]?.question ??
    q.translations.en?.question ??
    'Question unavailable'
  );
}

/**
 * Retrieves localized question options list.
 *
 * @param {object} q - Question object.
 * @param {string} lang - Locale code.
 * @returns {string[]} List of options.
 */
function questionOptions(q, lang) {
  return q.translations[lang]?.options ?? q.translations.en?.options ?? [];
}

/**
 * Retrieves correct answer text for a question in a given locale.
 *
 * @param {object} q - Question object.
 * @param {string} lang - Locale code.
 * @returns {string} Correct answer string.
 */
function correctAnswerText(q, lang) {
  const t = q.translations[lang] ?? q.translations.en;
  if (!t) return '';
  return t.correct_answer || t.options[q.correct_index] || '';
}

/**
 * Retrieves explanation text for a question in a given locale.
 *
 * @param {object} q - Question object.
 * @param {string} lang - Locale code.
 * @returns {string} Explanation string.
 */
function questionExplanation(q, lang) {
  const t = q.translations[lang] ?? q.translations.en;
  return t?.explanation ?? '';
}

/**
 * Builds Schema.org Quiz & Question structured data.
 *
 * @param {object} options - Options containing question, lang, number, site.
 * @returns {object} Quiz schema JSON-LD object.
 */
function questionJsonLd(options) {
  const { lang, question, number, site, imageBase = '/' } = options;
  const url = new URL(`/${lang}/questions/${number}`, site).href;
  const text = questionText(question, lang);
  const answer = correctAnswerText(question, lang);
  const explanation = questionExplanation(question, lang);
  const optionsList = questionOptions(question, lang);
  const img = question.image_url
    ? new URL(`${imageBase}${question.image_url.replace(/^\//, '')}`, site).href
    : undefined;

  const suggestedAnswers = optionsList
    .map((optText, idx) => ({ optText, idx }))
    .filter(({ idx }) => idx !== question.correct_index)
    .map(({ optText, idx }) => ({
      '@type': 'Answer',
      text: optText,
      inLanguage: lang,
      position: idx + 1,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: truncateMeta(text, 110),
    description: truncateMeta(`${text} Correct answer: ${answer}`, 155),
    inLanguage: lang,
    url,
    ...(img ? { image: img } : {}),
    hasPart: [
      {
        '@type': 'Question',
        name: truncateMeta(text, 110),
        text,
        inLanguage: lang,
        eduQuestionType: 'Multiple choice',
        ...(img ? { image: img } : {}),
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
          inLanguage: lang,
          position: question.correct_index + 1,
          ...(explanation
            ? {
              comment: {
                '@type': 'Comment',
                text: explanation,
              },
            }
            : {}),
        },
        suggestedAnswer: suggestedAnswers,
      },
    ],
  };
}

/**
 * Builds Schema.org FAQPage structured data for a list of questions.
 *
 * @param {object} options - Options containing questions and locale.
 * @returns {object} FAQPage schema JSON-LD object.
 */
function categoryFaqJsonLd(options) {
  const { lang, questions } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: questions.map((q) => {
      const qText = questionText(q, lang);
      const answer = correctAnswerText(q, lang);
      const explanation = questionExplanation(q, lang);
      return {
        '@type': 'Question',
        name: qText,
        inLanguage: lang,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
          inLanguage: lang,
          ...(explanation
            ? {
              comment: {
                '@type': 'Comment',
                text: explanation,
              },
            }
            : {}),
        },
      };
    }),
  };
}

/**
 * Builds Schema.org WebSite structured data.
 *
 * @param {object} [options] - Options containing site origin, name, description.
 * @returns {object} WebSite schema JSON-LD object.
 */
function webSiteJsonLd(options) {
  const site = options?.site;
  const siteUrl = new URL('/', site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options?.name ?? 'Provisoire',
    url: siteUrl,
    description:
      options?.description ??
      'Rwanda provisional driving test question bank, practice quizzes, and timed mock exam simulator in English, French, and Kinyarwanda.',
    inLanguage: options?.inLanguage ?? ['en', 'fr', 'rw'],
  };
}

/**
 * Builds Schema.org Organization structured data.
 *
 * @param {object} [options] - Options containing site origin, name, logoPath.
 * @returns {object} Organization schema JSON-LD object.
 */
function organizationJsonLd(options) {
  const site = options?.site;
  const siteUrl = new URL('/', site).href;
  const logo = new URL(options?.logoPath ?? '/icons/icon-192x192.png', site)
    .href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options?.name ?? 'Provisoire',
    url: siteUrl,
    logo,
  };
}

/**
 * Builds Schema.org BreadcrumbList structured data.
 *
 * @param {Array<{name: string, path: string}>} items - List of breadcrumb items.
 * @param {string} site - Site origin.
 * @returns {object} BreadcrumbList schema JSON-LD object.
 */
function breadcrumbJsonLd(items, site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.path, site).href,
    })),
  };
}

// 1. Validate Question Quiz schema across locales
for (const lang of ['en', 'fr', 'rw']) {
  const q = questionsBank.questions[0];
  const schema = questionJsonLd({
    lang,
    question: q,
    number: 1,
    site: SITE,
  });

  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'Quiz');
  assert.equal(schema.inLanguage, lang);
  assert.equal(schema.url, `https://provisoire.pages.dev/${lang}/questions/1`);
  assert.equal(schema.hasPart.length, 1);

  const mainQ = schema.hasPart[0];
  assert.equal(mainQ['@type'], 'Question');
  assert.equal(mainQ.eduQuestionType, 'Multiple choice');
  assert.equal(mainQ.inLanguage, lang);
  assert.equal(mainQ.acceptedAnswer['@type'], 'Answer');
  assert.equal(mainQ.acceptedAnswer.inLanguage, lang);
  assert.equal(mainQ.acceptedAnswer.position, q.correct_index + 1);

  assert.ok(Array.isArray(mainQ.suggestedAnswer));
  assert.equal(
    mainQ.suggestedAnswer.length,
    (q.translations[lang] || q.translations.en).options.length - 1,
  );
  for (const s of mainQ.suggestedAnswer) {
    assert.equal(s['@type'], 'Answer');
    assert.equal(s.inLanguage, lang);
    assert.ok(s.position > 0);
  }
}
console.log(
  '✓ Question Quiz / Question schema with acceptedAnswer and suggestedAnswer passed for all locales',
);

// 2. Validate Category FAQPage schema across locales
for (const catId of [1, 2]) {
  const catQuestions = questionsBank.questions
    .filter((q) => q.category_id === catId)
    .slice(0, 20);
  for (const lang of ['en', 'fr', 'rw']) {
    const faq = categoryFaqJsonLd({
      lang,
      questions: catQuestions,
      site: SITE,
    });

    assert.equal(faq['@context'], 'https://schema.org');
    assert.equal(faq['@type'], 'FAQPage');
    assert.equal(faq.inLanguage, lang);
    assert.equal(faq.mainEntity.length, catQuestions.length);

    for (let i = 0; i < catQuestions.length; i++) {
      const entity = faq.mainEntity[i];
      const q = catQuestions[i];
      assert.equal(entity['@type'], 'Question');
      assert.equal(entity.inLanguage, lang);
      assert.equal(entity.name, questionText(q, lang));
      assert.equal(entity.acceptedAnswer['@type'], 'Answer');
      assert.equal(entity.acceptedAnswer.inLanguage, lang);
      assert.equal(entity.acceptedAnswer.text, correctAnswerText(q, lang));
    }
  }
}
console.log(
  '✓ Category Hub FAQPage schema passed for all categories and locales',
);

// 3. Validate WebSite and Organization schema
const siteObj = webSiteJsonLd({ site: SITE });
assert.equal(siteObj['@context'], 'https://schema.org');
assert.equal(siteObj['@type'], 'WebSite');
assert.equal(siteObj.name, 'Provisoire');
assert.equal(siteObj.url, 'https://provisoire.pages.dev/');

const orgObj = organizationJsonLd({ site: SITE });
assert.equal(orgObj['@context'], 'https://schema.org');
assert.equal(orgObj['@type'], 'Organization');
assert.equal(orgObj.name, 'Provisoire');
assert.equal(orgObj.url, 'https://provisoire.pages.dev/');
assert.equal(
  orgObj.logo,
  'https://provisoire.pages.dev/icons/icon-192x192.png',
);
console.log('✓ WebSite and Organization schema passed');

// 4. Validate BreadcrumbList schema
const crumbs = breadcrumbJsonLd(
  [
    { name: 'Provisoire', path: '/' },
    { name: 'Questions', path: '/en/questions' },
    { name: 'Traffic Rules', path: '/en/questions/category/traffic-rules' },
  ],
  SITE,
);
assert.equal(crumbs['@context'], 'https://schema.org');
assert.equal(crumbs['@type'], 'BreadcrumbList');
assert.equal(crumbs.itemListElement.length, 3);
assert.equal(crumbs.itemListElement[0].position, 1);
assert.equal(crumbs.itemListElement[0].name, 'Provisoire');
assert.equal(crumbs.itemListElement[0].item, 'https://provisoire.pages.dev/');
console.log('✓ BreadcrumbList schema passed');

// 5. Test dist HTML if built
const distDir = resolve('dist');
if (existsSync(distDir)) {
  /**
   * Extracts JSON-LD scripts from rendered HTML content.
   *
   * @param {string} html - HTML string.
   * @returns {object[]} Parsed JSON-LD objects.
   */
  function extractJsonLd(html) {
    const regex =
      /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    const results = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        results.push(JSON.parse(match[1]));
      } catch (err) {
        throw new Error(`Failed to parse JSON-LD: ${match[1]}`, { cause: err });
      }
    }
    return results;
  }

  const qPath = resolve(distDir, 'en', 'questions', '1', 'index.html');
  if (existsSync(qPath)) {
    const html = readFileSync(qPath, 'utf8');
    const items = extractJsonLd(html);
    const quiz = items.find((i) => i['@type'] === 'Quiz');
    if (quiz) {
      assert.equal(quiz.inLanguage, 'en');
      assert.equal(quiz.hasPart[0]['@type'], 'Question');
      assert.equal(quiz.hasPart[0].eduQuestionType, 'Multiple choice');
      assert.equal(quiz.hasPart[0].acceptedAnswer['@type'], 'Answer');
      console.log(
        '✓ Verified live Quiz JSON-LD in dist/en/questions/1/index.html',
      );
    }
  }

  const trafficHubPath = resolve(distDir, 'en', 'traffic-rules', 'index.html');
  if (existsSync(trafficHubPath)) {
    const html = readFileSync(trafficHubPath, 'utf8');
    const items = extractJsonLd(html);
    const faq = items.find((i) => i['@type'] === 'FAQPage');
    const collection = items.find((i) => i['@type'] === 'CollectionPage');
    assert.ok(faq, 'FAQPage schema must exist on traffic-rules hub');
    assert.ok(
      collection,
      'CollectionPage schema must exist on traffic-rules hub',
    );
    assert.equal(faq.inLanguage, 'en');
    assert.equal(collection.mainEntity.numberOfItems, 101);
    console.log(
      '✓ Verified live FAQPage & CollectionPage JSON-LD in dist/en/traffic-rules/index.html',
    );
  }
}

console.log('\n======================================================');
console.log('All Structured Data (JSON-LD) verifications PASSED!');
console.log('======================================================\n');
