export type Lang = 'en' | 'fr' | 'rw';

export type QuestionTranslation = {
  question: string;
  options: string[];
  correct_answer?: string;
  explanation?: string | null;
};

export type Question = {
  id: string;
  category_id: number;
  category_name: string;
  image_url: string | null;
  correct_index: number;
  translations: Record<string, QuestionTranslation>;
};

export type Category = {
  id: number;
  name: string;
};

export type QuestionBank = {
  description: string;
  languages: Lang[];
  option_indexing: string;
  categories: Category[];
  total_questions: number;
  questions: Question[];
};
