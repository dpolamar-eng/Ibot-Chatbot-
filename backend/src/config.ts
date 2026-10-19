import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse allowed frontend origins strictly from environment variables without hardcoded origins
const rawFrontendOrigin = process.env.FRONTEND_ORIGIN || '';
const frontendOrigins = rawFrontendOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export interface AppConfig {
  port: number;
  host: string;
  frontendOrigins: string[];
  geminiApiKey: string;
  geminiModel: string;
}

export const config: AppConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  host: process.env.HOST || '0.0.0.0',
  frontendOrigins,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
};

export function isGeminiConfigured(): boolean {
  return Boolean(
    config.geminiApiKey &&
    config.geminiApiKey.trim() !== '' &&
    config.geminiApiKey !== 'your_gemini_api_key_here'
  );
}
