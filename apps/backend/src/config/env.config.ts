/* eslint-disable prettier/prettier */
import { config } from 'dotenv';

(config as () => void)();

interface Config {
  DATABASE_URL: string;
  DATABASE_POOL_SIZE: number;
  DATABASE_POOL_TIMEOUT: number;
  DATABASE_CONNECT_TIMEOUT: number;
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
    DATABASE_POOL_SIZE: Number(getEnvVar('DATABASE_POOL_SIZE', '10')),
    DATABASE_POOL_TIMEOUT: Number(getEnvVar('DATABASE_POOL_TIMEOUT', '10000')),
    DATABASE_CONNECT_TIMEOUT: Number(
      getEnvVar('DATABASE_CONNECT_TIMEOUT', '60000'),
    ),
    PORT: Number(getEnvVar('PORT', '8000')),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    CORS_ORIGINS: getEnvVar('CORS_ORIGINS', '*'),
    THROTTLE_TTL: Number(getEnvVar('THROTTLE_TTL', '60')),
    THROTTLE_LIMIT: Number(getEnvVar('THROTTLE_LIMIT', '100')),
    GLOBAL_PREFIX: getEnvVar('GLOBAL_PREFIX', 'api/v1/'),
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  } satisfies Config,
};
