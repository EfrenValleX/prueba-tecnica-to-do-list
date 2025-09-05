export function toBool(v: unknown): 0 | 1 | undefined {
  if (v === true || v === 'true' || v === '1' || v === 1) return 1;
  if (v === false || v === 'false' || v === '0' || v === 0) return 0;
  return undefined;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 0 | 1 | 2;
  completed: 0 | 1;
  created_at: string;
  updated_at: string | null;
}

export interface TaskPayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 0 | 1 | 2 | number;
  completed?: 0 | 1 | boolean | string | number;
}

export function sanitizeTaskPayload(
  body: Partial<TaskPayload>,
  { partial = false } = {}
): { data: Partial<TaskPayload>; errors: string[] } {
  const errors: string[] = [];
  const data: Partial<TaskPayload> = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.push('title es requerido y debe ser string no vacío');
    } else {
      data.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      errors.push('description debe ser string o null');
    } else {
      data.description = body.description ?? null;
    }
  }

  if (body.due_date !== undefined) {
    const d = new Date(body.due_date || '');
    if (isNaN(d.getTime())) {
      errors.push('due_date debe ser una fecha válida ISO 8601');
    } else {
      data.due_date = body.due_date ?? null;
    }
  }

  if (body.priority !== undefined) {
    const p = Number(body.priority);
    if (![0, 1, 2].includes(p)) errors.push('priority debe ser 0, 1 o 2');
    else data.priority = p as 0 | 1 | 2;
  }

  if (body.completed !== undefined) {
    const c = toBool(body.completed);
    if (c === undefined) errors.push('completed debe ser boolean/0/1');
    else data.completed = c;
  }

  return { data, errors };
}
