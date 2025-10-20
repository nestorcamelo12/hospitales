import { API_BASE_URL } from './config';

export interface MedicalRecord {
  id: number;
  paciente_id: number;
  medico_id: number;
  medico_nombre?: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export async function getMedicalRecords(pacienteId?: number): Promise<MedicalRecord[]> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (pacienteId) params.append('paciente_id', pacienteId.toString());

  const response = await fetch(`${API_BASE_URL}/medical-records?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener registros médicos');
  }

  const data = await response.json();
  return data.data;
}

export async function getMedicalRecord(id: number): Promise<MedicalRecord> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener registro médico');
  }

  const data = await response.json();
  return data.data;
}

export async function createMedicalRecord(record: Partial<MedicalRecord>): Promise<{ id: number }> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/medical-records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear registro médico');
  }

  const data = await response.json();
  return data.data;
}

export async function updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar registro médico');
  }
}

export async function deleteMedicalRecord(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar registro médico');
  }
}
