import { Controller, Get, Post, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { IsString, IsOptional, IsIn, IsBoolean, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

import { TasksService } from './tasks.service';
import { TASK_PRIORITIES } from '@shared/api.interface';
import type {
  Task,
  TaskListResponse,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@shared/api.interface';

class TaskListQueryDto {
  @IsOptional()
  @Type(() => String)
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;
}

class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsIn(TASK_PRIORITIES)
  priority!: '高' | '中' | '低';
}

class UpdateTaskDto implements UpdateTaskRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: '高' | '中' | '低';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;
}

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(@Query() query: TaskListQueryDto): Promise<TaskListResponse> {
    const items: Task[] = await this.tasksService.findAll(query.priority);
    return { items };
  }

  @Post()
  async create(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.tasksService.remove(Number(id));
  }
}
