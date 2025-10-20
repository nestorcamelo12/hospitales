import { API_BASE_URL } from './config';

export interface Emergencia {
  id: number;
  paciente_id: number;
  paciente_nombre?: string;
  paciente_documento?: string;
  hospital_destino_id: number;
  hospital_nombre?: string;
  unidad: string;
  paramedico_id?: number;
  paramedico_nombre?: string;
  medico_asignado_id?: number;
  medico_asignado_nombre?: string;
  estado: string;
  ubicacion_lat?: string;
  ubicacion_lng?: string;
  ubicacion_descripcion?: string;
  tipo_emergencia: string;
  descripcion: string;
  signos_vitales?: any;
  fecha: string;
  created_at: string;
  updated_at: string;
  historial_estados?: any[];
}

export interface EmergenciaFilters {
  page?: number;
  per_page?: number;
  estado?: string;
  hospital_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export async function getEmergencias(filters: EmergenciaFilters = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.estado && filters.estado !== 'all') params.append('estado', filters.estado);
  if (filters.hospital_id) params.append('hospital_id', filters.hospital_id.toString());
  if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

  const response = await fetch(`${API_BASE_URL}/emergencias?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener emergencias');
  }

  return await response.json();
}

export async function getEmergencia(id: number): Promise<Emergencia> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/emergencias/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener emergencia');
  }

  const data = await response.json();
  return data.data;
}

export async function createEmergencia(emergencia: Partial<Emergencia>): Promise<{ id: number }> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/emergencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(emergencia),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear emergencia');
  }

  const data = await response.json();
  return data.data;
}

export async function updateEmergencia(id: number, emergencia: Partial<Emergencia>): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/emergencias/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(emergencia),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar emergencia');
  }
}

export async function deleteEmergencia(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/emergencias/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar emergencia');
  }
}
