import { Document, DocumentCreate } from '@/types/document';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('인증이 필요합니다.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '요청 실패' }));
    throw new Error(error.detail || '요청 실패');
  }

  return response.json();
}

// Document API
interface DocumentListResponse {
  documents: Document[];
}

export const documentApi = {
  create: (data: DocumentCreate): Promise<Document> => {
    return fetchWithAuth<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<Document[]> => {
    const response = await fetchWithAuth<DocumentListResponse>('/api/documents');
    return response.documents;
  },

  getById: (id: string): Promise<Document> => {
    return fetchWithAuth<Document>(`/api/documents/${id}`);
  },

  delete: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Quiz API
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizGenerateRequest {
  document_id: string;
  question_count?: number;
  difficulty?: Difficulty;
}

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  source_excerpt: string;
}

export interface QuizGenerateResponse {
  quiz_id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  question_count: number;
  difficulty: Difficulty;
  created_at: string;
  document_title?: string;
  questions?: QuizQuestion[];
}

export interface QuizListResponse {
  quizzes: Quiz[];
}

export interface QuestionResult {
  question_id: string;
  correct: boolean;
  selected_index: number;
  correct_index: number;
  explanation: string;
  source_excerpt: string;
}

export interface QuizSubmitRequest {
  answers: Record<string, number>;
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  percentage: number;
  results: QuestionResult[];
}

export const quizApi = {
  generate: (data: QuizGenerateRequest): Promise<QuizGenerateResponse> => {
    return fetchWithAuth<QuizGenerateResponse>('/api/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: (): Promise<QuizListResponse> => {
    return fetchWithAuth<QuizListResponse>('/api/quizzes');
  },

  getById: (id: string): Promise<Quiz> => {
    return fetchWithAuth<Quiz>(`/api/quizzes/${id}`);
  },

  submit: (quizId: string, answers: Record<string, number>): Promise<QuizSubmitResponse> => {
    return fetchWithAuth<QuizSubmitResponse>(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  delete: (id: string): Promise<void> => {
    return fetchWithAuth<void>(`/api/quizzes/${id}`, {
      method: 'DELETE',
    });
  },
};
