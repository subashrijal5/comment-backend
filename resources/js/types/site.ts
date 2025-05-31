export interface Site {
  id: number;
  user_id: number;
  name: string;
  domain: string;
  token: string;
  created_at: string;
  updated_at: string;
  blogs?: Blog[];
}

export interface Blog {
  id: number;
  site_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
