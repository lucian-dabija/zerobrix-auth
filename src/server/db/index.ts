import { JSONDatabase } from './json';
import type { DatabaseInterface } from './interface';

export type { DatabaseInterface };
export { JSONDatabase };
export const db = JSONDatabase.getInstance();
export default db;