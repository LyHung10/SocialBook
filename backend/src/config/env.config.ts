import { registerAs } from '@nestjs/config';

export default registerAs('env', () => ({
  // Server
  PORT: parseInt(process.env.PORT ?? '', 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/socialbook',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  // Email
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // External APIs
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  FPT_API_KEY: process.env.FPT_API_KEY || '',
  FPT_VOICE: process.env.FPT_VOICE || 'banmai',
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',

  // Content Moderation API
  MODERATION_API_KEY: process.env.MODERATION_API_KEY || '',
  MODERATION_API_BASE_URL:
    process.env.MODERATION_API_BASE_URL || 'https://platform.beeknoee.com/v1',
  MODERATION_MODEL: process.env.MODERATION_MODEL || 'gemini-2.5-flash-lite',
  MODERATION_TIMEOUT:
    parseInt(process.env.MODERATION_TIMEOUT ?? '', 10) || 15000,

  // Chroma
  CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',
  CHROMA_COLLECTION: process.env.CHROMA_COLLECTION || 'socialbook_vectors',

  // Cache
  CACHE_TTL: parseInt(process.env.CACHE_TTL ?? '', 10) || 900,
}));
