import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Detectar entorno
const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Cargar el archivo .env correcto
const envFilePath = isProduction
  ? '.production.env'
  : isTest
    ? '.test.env'
    : '.development.env';

dotenv.config({ path: envFilePath, override: true });

console.log(`Entorno actual: ${nodeEnv}`);
console.log(`Cargando archivo env: ${envFilePath}`);

// Leer variable opcional para seed
const seedOnStart =
  process.env.SEED_ON_START?.toLowerCase() === 'true' ? true : false;

const config: DataSourceOptions = isProduction
  ? {
      type: 'postgres',
      // Render provee DATABASE_URL, así que lo usamos directamente
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      synchronize: false, // nunca usar auto-sync en prod
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      logging: false,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      ssl: false,
      synchronize: true,
      dropSchema: seedOnStart,
      logging: !isTest,
    };

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config);
