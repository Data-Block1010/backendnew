import { DataSource } from 'typeorm';
import { User } from './entitiy/User';
import { UserDataHash } from './entitiy/UserDataHash';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: false,
  logging: true,
  entities: [User, UserDataHash],
  migrations: ['src/migration/*.ts'],
  subscribers: [],
});
