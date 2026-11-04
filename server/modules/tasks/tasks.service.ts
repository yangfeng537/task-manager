import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import type { Task, TaskPriority } from '@shared/api.interface';
import { isTaskPriority } from '@shared/api.interface';

interface SupabaseTaskRow {
  id: number;
  title: string;
  priority: string;
  completed: boolean;
  created_at: string;
}

interface CreateTaskDto {
  title: string;
  priority: TaskPriority;
}

interface UpdateTaskDto {
  title?: string;
  priority?: TaskPriority;
  completed?: boolean;
}

@Injectable()
export class TasksService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: any) {}

  private mapRow(row: SupabaseTaskRow): Task {
    const priority = isTaskPriority(row.priority) ? row.priority : '中';
    return {
      id: row.id,
      title: row.title,
      priority,
      completed: row.completed,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async findAll(priority?: string): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (priority && priority !== 'all') {
      if (!isTaskPriority(priority)) {
        throw new BadRequestException('无效的优先级');
      }
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const rows = (data as SupabaseTaskRow[]) || [];
    return rows.map((row) => this.mapRow(row));
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title: dto.title,
        priority: dto.priority,
        completed: false,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.mapRow(data as SupabaseTaskRow);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.completed !== undefined) patch.completed = dto.completed;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116' || !data) {
        throw new NotFoundException('任务不存在');
      }
      throw new BadRequestException(error.message);
    }

    return this.mapRow(data as SupabaseTaskRow);
  }

  async remove(id: number): Promise<void> {
    const { data, error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new BadRequestException(error.message);
    if (!data || data.length === 0) {
      throw new NotFoundException('任务不存在');
    }
  }
}
