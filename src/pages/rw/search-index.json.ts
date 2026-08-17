import type { APIRoute } from 'astro';
import questionBank from '../../../questions.json';
import type { Question } from '../../lib/quiz';
import { buildSearchPayload } from '../../lib/search-build';

export const prerender = true;

export const GET: APIRoute = async () => {
  const payload = buildSearchPayload(
    questionBank.questions as Question[],
    'rw',
  );
  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, must-revalidate',
    },
  });
};
