import { API_BASE_URL } from './config';

export interface Notification {
  id: number;
  user_id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  paciente_id?: number;
  emergencia_id?: number;
  leido: number;
  leido_at?: string;
  created_at: string;
}

export interface NotificationFilters {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

export async function getNotifications(filters: NotificationFilters = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.unread_only) params.append('unread_only', '1');

  const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener notificaciones');
  }

  return await response.json();
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al marcar notificación como leída');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al marcar notificaciones como leídas');
  }
}
