import type { Lang, Question } from './quiz';
import {
  correctAnswerText,
  questionExplanation,
  questionNumber,
  questionOptions,
  questionText,
} from './quiz';
import type { SearchEntryPayload, SearchPayload } from './search';

/**
 * Builds the compact, minimal payload JSON for a specific locale at build time.
 * Strictly includes content for the requested locale ONLY.
 */
export function buildSearchPayload(
  questions: Question[],
  lang: Lang,
): SearchPayload {
  const items: SearchEntryPayload[] = questions.map((q, index) => {
    const n = questionNumber(index);
    const qText = questionText(q, lang);
    const options = questionOptions(q, lang);
    const explanation = questionExplanation(q, lang);
    const answer = correctAnswerText(q, lang);

    const entry: SearchEntryPayload = {
      n,
      c: q.category_id,
      q: qText,
      o: options,
    };

    if (explanation.trim()) {
      entry.e = explanation.trim();
    }
    if (answer.trim()) {
      entry.a = answer.trim();
    }

    return entry;
  });

  return {
    lang,
    total: items.length,
    items,
  };
}
