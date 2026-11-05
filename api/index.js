/**
 * Vercel Serverless 入口（Express + Supabase REST API）
 * 提供与 NestJS 后端完全一致的 /api/tasks 接口，前端无需任何改动。
 * 数据层：@supabase/supabase-js 直连 Supabase tasks 表。
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '1mb' }));

// 优先读取环境变量（Vercel 中配置），未配置时回退到默认项目
const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://dgsmeogzmwhyqzzzzrqy.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_YCq30tNoVWxTc65_z_EHug_FBoYtJly';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const TABLE = 'tasks';

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    completed: row.completed,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fail(res, statusCode, message) {
  res.status(statusCode).json({ statusCode, message });
}

// 查询任务列表（可按优先级筛选，按创建时间倒序）
app.get('/api/tasks', async (req, res) => {
  try {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    const priority = req.query.priority;
    if (priority === '高' || priority === '中' || priority === '低') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) return fail(res, 500, error.message);
    res.json({ items: (data ?? []).map(mapRow) });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const priority = body.priority || '中';

    if (!title || typeof title !== 'string') {
      return fail(res, 400, '任务标题不能为空');
    }
    if (!['高', '中', '低'].includes(priority)) {
      return fail(res, 400, '优先级只能是 高/中/低');
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ title, priority })
      .select()
      .single();

    if (error) return fail(res, 500, error.message);
    res.status(201).json(mapRow(data));
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// 切换完成状态（放在 :id 之前定义，避免路径歧义）
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: existing, error: findErr } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (findErr || !existing) return fail(res, 404, '任务不存在');

    const { data, error } = await supabase
      .from(TABLE)
      .update({ completed: !existing.completed })
      .eq('id', id)
      .select()
      .single();

    if (error) return fail(res, 500, error.message);
    res.json(mapRow(data));
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// 更新任务
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.completed !== undefined) patch.completed = body.completed;

    if (Object.keys(patch).length === 0) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .single();
      if (!existing) return fail(res, 404, '任务不存在');
      return res.json(mapRow(existing));
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return fail(res, 500, error.message);
    if (!data) return fail(res, 404, '任务不存在');
    res.json(mapRow(data));
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: existing, error: findErr } = await supabase
      .from(TABLE)
      .select('id')
      .eq('id', id)
      .single();
    if (findErr || !existing) return fail(res, 404, '任务不存在');

    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    res.json({ success: true });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// 其余 /api 路径统一 404
app.use('/api', (req, res) => fail(res, 404, 'Cannot ' + req.method + ' ' + req.path));

module.exports = app;
