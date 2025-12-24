export interface AddedUrl {
  url: string;
  platformId: string;
  metadata?: {
    title?: string;
    description?: string;
    thumbnail?: string | null;
    author?: string;
  };
}
