import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (databaseUrl?: string): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: databaseUrl || process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});