/* eslint-disable prettier/prettier */
import { config } from 'dotenv';

(config as () => void)();

interface Config {
  DATABASE_URL: string;
  PORT: number;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  GLOBAL_PREFIX: string;
  NODE_ENV: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

export const env = {
  config: {
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    PORT: Number(getEnvVar('PORT', '8000')),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    CORS_ORIGINS: getEnvVar('CORS_ORIGINS', '*'),
    THROTTLE_TTL: Number(getEnvVar('THROTTLE_TTL', '60')),
    THROTTLE_LIMIT: Number(getEnvVar('THROTTLE_LIMIT', '100')),
    GLOBAL_PREFIX: getEnvVar('GLOBAL_PREFIX', 'api/v1/'),
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  } satisfies Config,
};
