import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use('/api', apiRouter);

// The prototype is a single page; send the site root to it
app.get('/', (req, res) => res.redirect('/gmc-network-prototype.html'));

// The prototype has no favicon; answer the browser's automatic request quietly
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (isProd) {
  // Serve the Vite build output
  app.use(express.static(distDir, { extensions: ['html'] }));
} else {
  // Run Vite inside Express: one port, pages reload automatically on save
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(rootDir, 'vite.config.js'),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'mpa',
  });
  app.use(vite.middlewares);
}

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — the server is probably already running. Open http://localhost:${PORT}`);
    process.exit(1);
  }
  throw err;
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});
