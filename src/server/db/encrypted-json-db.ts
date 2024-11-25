import { promises as fs } from 'fs';
import { join } from 'path';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { User, NewUserData } from '../../types';
import type { DatabaseInterface } from './interface';

interface DBSchema {
  users: User[];
}

const defaultSchema: DBSchema = {
  users: []
};

export class EncryptedJSONDatabase implements DatabaseInterface {
  private static instance: EncryptedJSONDatabase;
  private dbPath: string;
  private data: DBSchema = defaultSchema;
  private initialized: boolean = false;
  private encryptionKey: Buffer;
  
  private constructor(dbPath?: string) {
    this.dbPath = dbPath || join(process.cwd(), 'data', 'zerobrix-users.encrypted.json');
    const key = process.env.DB_ENCRYPTION_KEY || randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  public static getInstance(dbPath?: string): EncryptedJSONDatabase {
    if (!EncryptedJSONDatabase.instance) {
      EncryptedJSONDatabase.instance = new EncryptedJSONDatabase(dbPath);
    }
    return EncryptedJSONDatabase.instance;
  }

  private async encrypt(data: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  private async decrypt(encryptedData: string): Promise<string> {
    const { iv, data, authTag } = JSON.parse(encryptedData);
    
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
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
      const encryptedContent = await fs.readFile(this.dbPath, 'utf-8');
      const decryptedContent = await this.decrypt(encryptedContent);
      this.data = JSON.parse(decryptedContent);
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
    const encryptedData = await this.encrypt(JSON.stringify(this.data));
    await fs.writeFile(this.dbPath, encryptedData);
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
    const user = this.data.users.find(u => 
      u.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    );
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
    await this.saveData();
    this.initialized = false;
  }
}