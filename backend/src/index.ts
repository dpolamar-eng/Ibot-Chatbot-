import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, isGeminiConfigured, isSupabaseConfigured } from './config.js';
import { chatRoutes } from './routes/chat.js';

const app = Fastify({
  logger: {
    level: 'info',
  },
});

// Configure CORS restricted to frontend origins loaded from environment variables
await app.register(cors, {
  origin: config.frontendOrigins,
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
    app.log.info(
      `📡 Configured Frontend Origins: ${
        config.frontendOrigins.length > 0 ? config.frontendOrigins.join(', ') : 'None (Strictly restricted)'
      }`
    );
    app.log.info(`🤖 Gemini Model: ${config.geminiModel}`);
    app.log.info(
      `🔑 Gemini API Key Status: ${
        isGeminiConfigured() ? 'Configured ✅' : 'Not Configured (using fallback guidance) ⚠️'
      }`
    );
    app.log.info(
      `🗄️  Supabase Database Status: ${
        isSupabaseConfigured() ? 'Configured ✅' : 'Pending configuration / Tables setup ⚠️'
      }`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
