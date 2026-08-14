import type { APIRoute } from 'astro';
import questionBank from '../../../questions.json';
import type { Question } from '../../lib/quiz';
import { isLang } from '../../lib/quiz';
import { buildSearchPayload } from '../../lib/search-build';

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { lang: 'en' } }, { params: { lang: 'fr' } }, { params: { lang: 'rw' } }];
}

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang;
  if (!isLang(lang)) {
    return new Response(JSON.stringify({ error: 'Unknown locale' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const payload = buildSearchPayload(
    questionBank.questions as Question[],
    lang,
  );

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, must-revalidate',
    },
  });
};
