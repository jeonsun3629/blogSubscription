// Notion 데이터 타입 정의

export interface NotionPost {
  id: string;
  title: string;
  date: string | null;
  category: string;
  excerpt: string;
  content_full?: string;
  imageUrl?: string;
  videoUrl?: string;
  clickCount?: number;
}

export interface NotionPostDetail extends NotionPost {
  content: NotionBlock[];
}

export interface NotionBlock {
  type: string;
  text?: string;
  url?: string;
}

export interface NotionResponse {
  results: any[];
} 