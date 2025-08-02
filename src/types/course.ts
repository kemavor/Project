export interface CourseDocument {
  id: number;
  title: string;
  filename: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  is_public: boolean;
  created_at: string;
  download_url: string;
  view_url: string;
  s3_url?: string;
} 