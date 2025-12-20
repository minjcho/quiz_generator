export interface Question {
  id: string;
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  source_excerpt: string;
}

export interface Quiz {
  id: string;
  title: string;
  document_id: string;
  question_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  created_at: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null;
}

export interface QuizResult {
  questionId: string;
  correct: boolean;
  selectedIndex: number;
  correctIndex: number;
  explanation: string;
  sourceExcerpt: string;
}
