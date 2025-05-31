export interface Site {
  id: number;
  user_id: number;
  name: string;
  domain: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  blogs?: Blog[];
}

export interface Blog {
  id: number;
  site_id: number;
  url: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  reactions?: Reaction[];
}

export interface Comment {
  id: number;
  blog_id: number;
  parent_id: number | null;
  name: string;
  email: string;
  body: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  reactions?: Reaction[];
  parent?: Comment;
}

export interface Reaction {
  id: number;
  blog_id: number | null;
  comment_id: number | null;
  type: string;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
  links: PaginationLink[];
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}
