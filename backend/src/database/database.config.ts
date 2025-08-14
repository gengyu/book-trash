import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LearningSession } from './learning-session.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: process.env.DB_PATH || './database.sqlite',
  entities: [LearningSession],
  synchronize: true, // 在生产环境中应该设置为false
  logging: process.env.NODE_ENV === 'development',
};