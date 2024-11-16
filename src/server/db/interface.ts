import type { User, NewUserData } from '../../types';

export interface DatabaseInterface {
  initialize(): Promise<void>;
  findUser(walletAddress: string): Promise<User | null>;
  createUser(userData: NewUserData): Promise<User>;
  updateUser(walletAddress: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(walletAddress: string): Promise<boolean>;
  close(): Promise<void>;
}