import { API_BASE_URL } from './config';

export interface DashboardStats {
  totales: {
    pacientes: number;
    emergencias_activas: number;
    emergencias_hoy: number;
    consultas_semana: number;
    pacientes_criticos: number;
  };
  ultimas_emergencias: Array<{
    id: number;
    fecha: string;
    estado: string;
    unidad: string;
    paciente_nombre: string;
  }>;
  emergencias_por_dia: Array<{
    dia: string;
    total: number;
  }>;
  alertas_criticas?: Array<{
    id: number;
    paciente_nombre: string;
    paciente_documento: string;
    tipo: string;
    valor: string;
    unidad: string;
    fecha: string;
  }>;
  pacientes_recientes?: Array<{
    id: number;
    nombre: string;
    documento: string;
    edad: number;
    tipo_sangre: string;
    ultima_consulta: string;
    signos_vitales: {
      pa?: string;
      pulso?: number;
      spo2?: number;
      temp?: number;
    };
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas del dashboard');
  }

  const data = await response.json();
  return data.data;
}

export async function getAlertasCriticas(): Promise<Array<{
  id: number;
  paciente_nombre: string;
  paciente_documento: string;
  tipo: string;
  valor: string;
  unidad: string;
  fecha: string;
}>> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/reports/alertas-criticas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener alertas críticas');
  }

  const data = await response.json();
  return data.data;
}

export async function getPacientesRecientes(): Promise<Array<{
  id: number;
  nombre: string;
  documento: string;
  edad: number;
  tipo_sangre: string;
  ultima_consulta: string;
  signos_vitales: {
    pa?: string;
    pulso?: number;
    spo2?: number;
    temp?: number;
  };
}>> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/reports/pacientes-recientes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener pacientes recientes');
  }

  const data = await response.json();
  return data.data;
}

export async function exportPacientes(): Promise<Blob> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/reports/export/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al exportar pacientes');
  }

  return response.blob();
}

export async function exportEmergencias(fechaInicio?: string, fechaFin?: string): Promise<Blob> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_BASE_URL}/reports/export/emergencias?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al exportar emergencias');
  }

  return response.blob();
}
