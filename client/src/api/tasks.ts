import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Task,
  TaskListResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
} from '@shared/api.interface';

export async function getTasks(priority?: TaskPriority | 'all'): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (priority && priority !== 'all') {
    params.priority = priority;
  }
  const response = await axiosForBackend.get<TaskListResponse>('/api/tasks', { params });
  return response.data.items;
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await axiosForBackend.post<Task>('/api/tasks', data);
  return response.data;
}

export async function updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
  const response = await axiosForBackend.patch<Task>(`/api/tasks/${id}`, data);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  await axiosForBackend.delete(`/api/tasks/${id}`);
}
