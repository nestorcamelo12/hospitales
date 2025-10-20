import { API_BASE_URL } from './config';

export interface Vital {
  id: number;
  paciente_id: number;
  emergencia_id?: number;
  tipo: string;
  valor: string;
  unidad?: string;
  registrado_por: number;
  fecha: string;
}

export interface VitalFilters {
  paciente_id?: number;
  emergencia_id?: number;
  tipo?: string;
  limit?: number;
}

export async function getVitals(filters: VitalFilters = {}): Promise<Vital[]> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters.paciente_id) params.append('paciente_id', filters.paciente_id.toString());
  if (filters.emergencia_id) params.append('emergencia_id', filters.emergencia_id.toString());
  if (filters.tipo) params.append('tipo', filters.tipo);
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE_URL}/vitals?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener signos vitales');
  }

  const data = await response.json();
  return data.data;
}

export async function getVital(id: number): Promise<Vital> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/vitals/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener signo vital');
  }

  const data = await response.json();
  return data.data;
}

export async function createVital(vital: Partial<Vital>): Promise<{ id: number }> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/vitals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(vital),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear signo vital');
  }

  const data = await response.json();
  return data.data;
}
