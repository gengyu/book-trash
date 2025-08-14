export const databaseConfig = {
  type: 'sqlite' as const,
  database: 'database.sqlite',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
};