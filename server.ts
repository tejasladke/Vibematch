import "dotenv/config";
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { connectMongoDB } from './server/db.js';
import { initSocketServer } from './server/socket.js';
import apiRoutes from './server/routes/api.js';


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = http.createServer(app);

  // Initialize DB Connection
  await connectMongoDB();

  // Basic Middlewares
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Initialize Socket.IO Server
  initSocketServer(httpServer);

  // Mount API routes FIRST
  app.use('/api', apiRoutes);

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 PlanMate Full-Stack Server active on http://0.0.0.0:${PORT}`);
    console.log(`⚡ Real-time Socket.IO & REST APIs loaded successfully.`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]', err);
});
