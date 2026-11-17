import { useState, useEffect, useCallback } from 'react';
import { Check, Trash2, Plus, ListTodo } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { toast } from 'sonner';

import { tasks as tasksApi } from '@client/src/api';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskPriority,
  type Task,
} from '@shared/api.interface';

const priorityBadgeVariant: Record<TaskPriority, string> = {
  高: 'bg-status-high text-status-high-foreground',
  中: 'bg-status-medium text-status-medium-foreground',
  低: 'bg-status-low text-status-low-foreground',
};

const priorityBorderClass: Record<TaskPriority, string> = {
  高: 'border-l-status-high',
  中: 'border-l-status-medium',
  低: 'border-l-status-low',
};

export default function TasksPage() {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('中');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await tasksApi.getTasks(filterPriority);
      setTaskList(list);
    } catch (e) {
      console.error('加载任务失败', e);
      toast.error('加载失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [filterPriority]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await tasksApi.createTask({ title: title.trim(), priority });
      setTitle('');
      toast.success('任务已添加');
      refresh();
    } catch (e) {
      console.error('添加失败', e);
      toast.error('添加失败，请重试');
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await tasksApi.updateTask(task.id, { completed: !task.completed });
      refresh();
    } catch (e) {
      console.error('切换状态失败', e);
      toast.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      toast.success('任务已删除');
      refresh();
    } catch (e) {
      console.error('删除失败', e);
      toast.error('删除失败，请重试');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const completedCount = taskList.filter((t: Task) => t.completed).length;
  const totalCount = taskList.length;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto rise">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">任务管理</h1>
            <p className="text-sm text-muted-foreground">
              共 {totalCount} 项任务，已完成 {completedCount} 项
            </p>
          </div>
        </div>

        <Card className="mb-6 border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">添加新任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="输入任务内容..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-10"
                />
              </div>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="w-24 h-10">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="h-10 px-4"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">任务列表</h2>
          <Select
            value={filterPriority}
            onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}优先级
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : taskList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">暂无任务</p>
              <p className="text-muted-foreground text-xs mt-1">
                在上方输入框添加你的第一个任务吧
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {taskList.map((task: Task) => (
              <div
                key={task.id}
                className={`bg-card border rounded-lg px-4 py-3 flex items-center gap-3 border-l-4 ${priorityBorderClass[task.priority]} transition-all hover:bg-accent/50`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 rounded-full border-2 flex-shrink-0 ${
                    task.completed
                      ? 'bg-success border-success text-success-foreground'
                      : 'border-input hover:border-primary hover:text-primary'
                  }`}
                  onClick={() => handleToggle(task)}
                  aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
                >
                  {task.completed && <Check className="w-4 h-4" />}
                </Button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      task.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {task.title}
                  </p>
                </div>

                <Badge
                  className={`${priorityBadgeVariant[task.priority]} text-xs font-normal px-2 py-0.5`}
                >
                  {TASK_PRIORITY_LABELS[task.priority]}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(task.id)}
                  aria-label="删除任务"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
