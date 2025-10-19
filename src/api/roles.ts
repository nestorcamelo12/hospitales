import { fetchApi } from './config';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export async function getRoles(): Promise<Role[]> {
  return fetchApi<Role[]>('/roles');
}



