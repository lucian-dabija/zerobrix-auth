import sqlite3 from 'better-sqlite3';
import { join } from 'path';
import { User, NewUserData } from '../../types';

export class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: sqlite3.Database;
  private initialized: boolean = false;

  private constructor(dbPath?: string) {
    const defaultPath = join(process.cwd(), 'data', 'zerobrix-users.db');
    this.db = sqlite3(dbPath || defaultPath);
    this.db.pragma('journal_mode = WAL');
  }

  public static getInstance(dbPath?: string): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase(dbPath);
    }
    return SQLiteDatabase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          wallet_address TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT,
          role TEXT NOT NULL DEFAULT 'User',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public async findUser(walletAddress: string): Promise<User | null> {
    await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM users WHERE wallet_address = ?
      `);
      
      const row = stmt.get(walletAddress) as User | undefined;
      
      if (!row) return null;
      
      return {
        wallet_address: row.wallet_address,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        role: row.role,
        created_at: row.created_at
      };
    } catch (error) {
      console.error('Failed to find user:', error);
      throw error;
    }
  }

  public async createUser(userData: NewUserData): Promise<User> {
    await this.initialize();

    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (wallet_address, first_name, last_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      
      const result = stmt.run(
        userData.wallet_address,
        userData.first_name,
        userData.last_name,
        userData.email || null,
        userData.role || 'User'
      );

      if (result.changes !== 1) {
        throw new Error('Failed to insert user');
      }

      return {
        ...userData,
        role: userData.role || 'User',
        created_at: now
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  public async updateUser(walletAddress: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();

    try {
      const updateFields = Object.keys(updates)
        .filter(key => key !== 'wallet_address' && key !== 'created_at')
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.keys(updates)
        .filter(key => key !== 'wallet_address' && key !== 'created_at')
        .map(key => updates[key as keyof User]);

      if (!updateFields) return null;

      const stmt = this.db.prepare(`
        UPDATE users
        SET ${updateFields}
        WHERE wallet_address = ?
        RETURNING *
      `);

      const result = stmt.get(...values, walletAddress) as User | undefined;
      
      return result || null;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  public async deleteUser(walletAddress: string): Promise<boolean> {
    await this.initialize();

    try {
      const stmt = this.db.prepare(`
        DELETE FROM users WHERE wallet_address = ?
      `);

      const result = stmt.run(walletAddress);
      
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
      } catch (error) {
        console.error('Error closing database:', error);
        throw error;
      }
    }
  }
}