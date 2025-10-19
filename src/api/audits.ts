import { fetchApi } from './config';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity: string;
  entity_id: number | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export async function getAudits(limit?: number, entity?: string): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (entity) params.append('entity', entity);
  
  const query = params.toString();
  return fetchApi<AuditLog[]>(`/audits${query ? `?${query}` : ''}`);
}



