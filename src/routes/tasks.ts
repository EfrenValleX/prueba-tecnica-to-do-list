import { Router, Request, Response } from 'express';
import { all, get, run } from '../db.js';
import { sanitizeTaskPayload, toBool, Task } from '../lib/validate.js';

export const router = Router();

/**
 * GET /tasks
 * Lista tareas (con filtro opcional por completed)
 */
router.get('/', (req: Request, res: Response) => {
  const { completed } = req.query;

  const filters: string[] = [];
  const params: Record<string, unknown> = {};

  if (completed !== undefined) {
    const c = toBool(completed);
    if (c !== undefined) {
      filters.push('completed = @completed');
      params.completed = c;
    }
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const items = all<Task>(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`, params);
  res.json(items);
});

/**
 * GET /tasks/:id
 * Devuelve una tarea por id
 */
router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const task = get<Task>('SELECT * FROM tasks WHERE id = @id', { id });
  if (!task) return res.status(404).json({ error: 'No encontrada' });
  res.json(task);
});

/**
 * POST /tasks
 * Crea una nueva tarea
 */
router.post('/', (req: Request, res: Response) => {
  const { data, errors } = sanitizeTaskPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const now = new Date().toISOString();
  const info = run(
    `INSERT INTO tasks (title, description, due_date, priority, completed, created_at, updated_at)
     VALUES (@title, @description, @due_date, @priority, @completed, @created_at, @updated_at)`,
    {
      title: data.title,
      description: data.description ?? null,
      due_date: data.due_date ?? null,
      priority: (data.priority as 0 | 1 | 2 | undefined) ?? 0,
      completed: (data.completed as 0 | 1 | undefined) ?? 0,
      created_at: now,
      updated_at: now
    }
  );

  const created = get<Task>('SELECT * FROM tasks WHERE id = @id', { id: info.lastInsertRowid });
  return res.status(201).json(created);
});

/**
 * PATCH /tasks/:id
 * Actualiza parcialmente una tarea
 */
router.patch('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = get<Task>('SELECT * FROM tasks WHERE id = @id', { id });
  if (!existing) return res.status(404).json({ error: 'No encontrada' });

  const { data, errors } = sanitizeTaskPayload(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ errors });
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

  const fields = Object.keys(data).map((k) => `${k} = @${k}`);
  const now = new Date().toISOString();

  run(`UPDATE tasks SET ${fields.join(', ')}, updated_at = @updated_at WHERE id = @id`, {
    ...data,
    updated_at: now,
    id
  });

  const updated = get<Task>('SELECT * FROM tasks WHERE id = @id', { id });
  res.json(updated);
});

/**
 * DELETE /tasks/:id
 * Elimina una tarea
 */
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const info = run('DELETE FROM tasks WHERE id = @id', { id });
  if (info.changes === 0) return res.status(404).json({ error: 'No encontrada' });
  return res.status(204).send();
});
