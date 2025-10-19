import { fetchApi, PaginatedResponse, ApiResponse } from './config';

export interface UserData {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  hospital_id: number | null;
  hospital_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  role_description?: string;
  hospital_address?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role_id: number;
  hospital_id?: number | null;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  password?: string;
  role_id: number;
  hospital_id?: number | null;
  is_active?: boolean;
}

export interface UsersFilters {
  page?: number;
  per_page?: number;
  search?: string;
  role_id?: number;
  hospital_id?: number;
  is_active?: number;
}

export async function getUsers(filters: UsersFilters = {}): Promise<PaginatedResponse<UserData>> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.role_id) params.append('role_id', filters.role_id.toString());
  if (filters.hospital_id) params.append('hospital_id', filters.hospital_id.toString());
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

  const query = params.toString();
  return fetchApi<PaginatedResponse<UserData>>(`/users${query ? `?${query}` : ''}`);
}

export async function getUser(id: number): Promise<UserData> {
  return fetchApi<UserData>(`/users/${id}`);
}

export async function createUser(data: CreateUserRequest): Promise<ApiResponse<UserData>> {
  return fetchApi<ApiResponse<UserData>>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<UserData>> {
  return fetchApi<ApiResponse<UserData>>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  return fetchApi<ApiResponse<void>>(`/users/${id}`, {
    method: 'DELETE',
  });
}


