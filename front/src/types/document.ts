export type SourceType = 'text' | 'pdf' | 'url';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  source_type: SourceType;
  source_url: string | null;
  content_text: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  source_type: SourceType;
  content_text: string;
  source_url?: string;
}

export interface DocumentUpdate {
  title?: string;
  content_text?: string;
}
