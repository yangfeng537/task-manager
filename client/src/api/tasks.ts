import type {
  Task,
  TaskListResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
} from '@shared/api.interface';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`请求失败：HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function getTasks(priority?: TaskPriority | 'all'): Promise<Task[]> {
  const query =
    priority && priority !== 'all'
      ? `?priority=${encodeURIComponent(priority)}`
      : '';
  const data = await request<TaskListResponse>('GET', `/api/tasks${query}`);
  return data.items;
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  return request<Task>('POST', '/api/tasks', data);
}

export async function updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
  return request<Task>('PATCH', `/api/tasks/${id}`, data);
}

export async function deleteTask(id: number): Promise<void> {
  await request('DELETE', `/api/tasks/${id}`);
}
