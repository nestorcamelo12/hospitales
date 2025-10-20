import { fetchApi } from './config';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export async function getRoles(): Promise<Role[]> {
  const response = await fetchApi<{ status: string; data: Role[] }>('/roles');
  return response.data;
}



