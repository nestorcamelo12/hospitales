import { fetchApi, ApiResponse } from './config';

export interface Hospital {
  id: number;
  name: string;
  address: string;
  phone: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateHospitalRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateHospitalRequest {
  name: string;
  address?: string;
  phone?: string;
}

export async function getHospitals(search?: string): Promise<Hospital[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return fetchApi<Hospital[]>(`/hospitals${params}`);
}

export async function getHospital(id: number): Promise<Hospital> {
  return fetchApi<Hospital>(`/hospitals/${id}`);
}

export async function createHospital(data: CreateHospitalRequest): Promise<ApiResponse<Hospital>> {
  return fetchApi<ApiResponse<Hospital>>('/hospitals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHospital(id: number, data: UpdateHospitalRequest): Promise<ApiResponse<Hospital>> {
  return fetchApi<ApiResponse<Hospital>>(`/hospitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHospital(id: number): Promise<ApiResponse<void>> {
  return fetchApi<ApiResponse<void>>(`/hospitals/${id}`, {
    method: 'DELETE',
  });
}


