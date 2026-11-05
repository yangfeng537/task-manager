const app = require('/home/user/Doubao/chats/38451478849813762/task-manager/api/index.js');

const PORT = 3457;
const base = `http://127.0.0.1:${PORT}`;
const results = [];
function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

const server = app.listen(PORT, async () => {
  try {
    // 1. 查询列表
    let r = await fetch(`${base}/api/tasks`);
    let body = await r.json();
    log('查询列表', r.ok && Array.isArray(body.items), `HTTP ${r.status}, 现有 ${body.items ? body.items.length : '?'} 条`);

    // 2. 添加三条任务（高/中/低）
    const created = [];
    for (const [title, priority] of [['高优先级测试', '高'], ['中优先级测试', '中'], ['低优先级测试', '低']]) {
      r = await fetch(`${base}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority }),
      });
      body = await r.json();
      if (r.status === 201 && body.id) { created.push(body); log(`添加任务「${title}」`, true, `id=${body.id}, priority=${body.priority}`); }
      else log(`添加任务「${title}」`, false, `HTTP ${r.status}: ${JSON.stringify(body)}`);
    }

    // 3. 按优先级筛选（高）
    r = await fetch(`${base}/api/tasks?priority=${encodeURIComponent('高')}`);
    body = await r.json();
    const allHigh = body.items && body.items.length > 0 && body.items.every(t => t.priority === '高');
    log('按优先级筛选（高）', r.ok && allHigh, `返回 ${body.items ? body.items.length : '?'} 条，全部为高`);

    // 4. 验证倒序（按 created_at 降序）
    r = await fetch(`${base}/api/tasks`);
    body = await r.json();
    const items = body.items || [];
    const desc = items.length < 2 || items.slice(1).every((t, i) => new Date(items[i].createdAt) >= new Date(t.createdAt));
    log('按创建时间倒序', r.ok && desc, items.map(t => t.title).join(' > '));

    // 5. 切换完成状态（PATCH /api/tasks/:id）
    if (created[0]) {
      r = await fetch(`${base}/api/tasks/${created[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      body = await r.json();
      log('切换完成状态为已完成', r.ok && body.completed === true, `completed=${body.completed}`);
      // 再切回未完成
      r = await fetch(`${base}/api/tasks/${created[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false }),
      });
      body = await r.json();
      log('切换回未完成', r.ok && body.completed === false, `completed=${body.completed}`);

      // 6. toggle 接口
      r = await fetch(`${base}/api/tasks/${created[0].id}/toggle`, { method: 'PATCH' });
      body = await r.json();
      log('toggle 接口', r.ok && body.completed === true, `completed=${body.completed}`);
    }

    // 7. 删除任务
    let allDeleted = true;
    for (const t of created) {
      r = await fetch(`${base}/api/tasks/${t.id}`, { method: 'DELETE' });
      if (!r.ok) { allDeleted = false; log(`删除任务 id=${t.id}`, false, `HTTP ${r.status}`); }
    }
    if (created.length) log('删除全部测试任务', allDeleted);

    // 8. 最终确认表已清空
    r = await fetch(`${base}/api/tasks`);
    body = await r.json();
    log('删除后列表复查', r.ok && (body.items || []).length === 0, `剩余 ${body.items ? body.items.length : '?'} 条`);

    const failed = results.filter(x => !x.ok).length;
    console.log(`\n===== 测试结果：${results.length - failed}/${results.length} 通过 =====`);
  } catch (e) {
    console.error('测试异常:', e);
  } finally {
    server.close(() => process.exit(results.some(x => !x.ok) ? 1 : 0));
  }
});
