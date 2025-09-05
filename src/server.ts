import 'dotenv/config';
import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { router as tasksRouter } from './routes/tasks.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    port: process.env.PORT,
    db: process.env.DATABASE_URL
  });
});

app.use('/tasks', tasksRouter);

// 404 general
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
