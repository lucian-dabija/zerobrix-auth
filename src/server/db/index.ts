import { SQLiteDatabase } from './sqlite';
import type { DatabaseInterface } from './interface';

export type { DatabaseInterface };

export { SQLiteDatabase };

export const db = SQLiteDatabase.getInstance();

export default db;