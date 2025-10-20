import { API_BASE_URL } from './config';

export interface Patient {
  id: number;
  nombre: string;
  documento: string;
  fecha_nac: string;
  edad: number;
  tipo_sangre: string;
  sexo?: string;
  contacto_emergencia?: string;
  hospital_id: number;
  hospital_nombre?: string;
  alergias?: string;
  condiciones_preexistentes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface PatientFilters {
  page?: number;
  per_page?: number;
  search?: string;
  hospital_id?: number;
}

export async function getPatients(filters: PatientFilters = {}): Promise<PaginatedResponse<Patient>> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.hospital_id) params.append('hospital_id', filters.hospital_id.toString());

  const response = await fetch(`${API_BASE_URL}/patients?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener pacientes');
  }

  const data = await response.json();
  return data;
}

export async function getPatient(id: number): Promise<Patient> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener paciente');
  }

  const data = await response.json();
  return data.data;
}

export async function createPatient(patient: Partial<Patient>): Promise<{ id: number }> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear paciente');
  }

  const data = await response.json();
  return data.data;
}

export async function updatePatient(id: number, patient: Partial<Patient>): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar paciente');
  }
}

export async function deletePatient(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar paciente');
  }
}

export async function getPatientMedicalRecords(id: number): Promise<any[]> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients/${id}/medical-records`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener historial médico');
  }

  const data = await response.json();
  return data.data;
}

export async function getPatientEmergencias(id: number): Promise<any[]> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/patients/${id}/emergencias`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener emergencias');
  }

  const data = await response.json();
  return data.data;
}

export async function getPatientVitals(id: number, limit?: number): Promise<any[]> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/patients/${id}/vitals?${params}`, {
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
