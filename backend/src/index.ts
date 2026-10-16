import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, isGeminiConfigured } from './config.js';
import { chatRoutes } from './routes/chat.js';

const app = Fastify({
  logger: {
    level: 'info',
  },
});

// Configure CORS restricted to frontend origin
await app.register(cors, {
  origin: [config.frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
});

// Register routes
await app.register(chatRoutes);

// Graceful shutdown handling
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, closing server gracefully...`);
    await app.close();
    process.exit(0);
  });
}

// Start Fastify server
async function start() {
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`🚀 IBOT Chatbot Backend running at http://localhost:${config.port}`);
    app.log.info(`📡 Configured Frontend Origin: ${config.frontendOrigin}`);
    app.log.info(`🤖 Gemini Model: ${config.geminiModel}`);
    app.log.info(
      `🔑 Gemini API Key Status: ${
        isGeminiConfigured() ? 'Configured ✅' : 'Not Configured (using fallback guidance) ⚠️'
      }`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
