import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Detectar entorno
const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Si no hay NODE_ENV definido, asumimos producción (Render siempre tiene variables de entorno)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Cargar el archivo .env correcto solo en local
if (!isProduction) {
  const envFilePath = isTest ? '.test.env' : '.development.env';
  dotenv.config({ path: envFilePath, override: true });
  console.log(`Cargando archivo env local: ${envFilePath}`);
} else {
  console.log('Cargando variables de entorno de Render (production)');
}

// Leer variable opcional para seed
const seedOnStart =
  process.env.SEED_ON_START?.toLowerCase() === 'true' ? true : false;

// ⚙️ Configuración de conexión
const config: DataSourceOptions = isProduction
  ? {
      type: 'postgres',
      url: process.env.DATABASE_URL, // Render usa esta variable
      ssl: { rejectUnauthorized: false },
      synchronize:
        process.env.SYNCHRONIZE?.toLowerCase() === 'true' ? true : false, // 🔥 configurable desde Render
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
