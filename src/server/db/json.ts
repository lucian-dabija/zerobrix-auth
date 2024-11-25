import { promises as fs } from 'fs';
import { join } from 'path';
import { User, NewUserData } from '../../types';
import type { DatabaseInterface } from './interface';

interface DBSchema {
  users: User[];
}

const defaultSchema: DBSchema = {
  users: []
};

export class JSONDatabase implements DatabaseInterface {
  private static instance: JSONDatabase;
  private dbPath: string;
  private data: DBSchema = defaultSchema;
  private initialized: boolean = false;

  private constructor(dbPath?: string) {
    this.dbPath = dbPath || join(process.cwd(), 'data', 'zerobrix-users.json');
  }

  public static getInstance(dbPath?: string): JSONDatabase {
    if (!JSONDatabase.instance) {
      JSONDatabase.instance = new JSONDatabase(dbPath);
    }
    return JSONDatabase.instance;
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = this.dbPath.substring(0, this.dbPath.lastIndexOf('/'));
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async loadData(): Promise<void> {
    try {
      const content = await fs.readFile(this.dbPath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.data = defaultSchema;
        await this.saveData();
      } else {
        throw error;
      }
    }
  }

  private async saveData(): Promise<void> {
    await this.ensureDirectoryExists();
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadData();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public async findUser(walletAddress: string): Promise<User | null> {
    await this.initialize();
    const user = this.data.users.find(u => u.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    return user || null;
  }

  public async createUser(userData: NewUserData): Promise<User> {
    await this.initialize();
    
    const existingUser = await this.findUser(userData.wallet_address);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      role: userData.role || 'User',
      created_at: now
    };

    this.data.users.push(newUser);
    await this.saveData();

    return newUser;
  }

  public async updateUser(walletAddress: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();
    
    const index = this.data.users.findIndex(u => 
      u.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (index === -1) return null;

    const updatedUser = {
      ...this.data.users[index],
      ...updates,
      wallet_address: this.data.users[index].wallet_address
    };

    this.data.users[index] = updatedUser;
    await this.saveData();

    return updatedUser;
  }

  public async deleteUser(walletAddress: string): Promise<boolean> {
    await this.initialize();
    
    const initialLength = this.data.users.length;
    this.data.users = this.data.users.filter(u => 
      u.wallet_address.toLowerCase() !== walletAddress.toLowerCase()
    );
    
    if (this.data.users.length !== initialLength) {
      await this.saveData();
      return true;
    }
    
    return false;
  }

  public async close(): Promise<void> {
    return Promise.resolve();
  }
}