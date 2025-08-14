export const databaseConfig = {
  type: 'better-sqlite3' as const,
  database: 'database.sqlite',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
};