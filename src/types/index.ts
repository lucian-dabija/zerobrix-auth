// src/types/index.ts

import type { NextRequest } from 'next/server';

export interface User {
  wallet_address: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  created_at?: string;
}

export interface NewUserData {
  wallet_address: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
}

export interface QRCodeConfig {
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  imageSettings?: {
    src?: string;
    height?: number;
    width?: number;
    excavate?: boolean;
  };
}

export interface WalletAuthConfig {
  appName: string;
  appDescription: string;
  theme?: {
    primary: string;
    secondary: string;
  };
  logo?: {
    src: string;
    width: number;
    height: number;
  };
  customStyles?: {
    container?: string;
    card?: string;
    button?: string;
    input?: string;
    select?: string;
  };
  dbPath?: string;
  qrCode?: QRCodeConfig;
  timeouts?: {
    authentication?: number;  // milliseconds
    polling?: number;        // milliseconds
  };
}

export interface WalletAuthHandlerConfig {
  validateUser?: (walletAddress: string) => Promise<User | null>;
  onNewUser?: (user: NewUserData) => Promise<void>;
  customValidation?: (walletAddress: string) => Promise<boolean>;
  dbPath?: string;
}

export interface AuthResponse {
  authenticated: boolean;
  userAddress?: string;
  user?: User;
  error?: string;
}

export interface NonceResponse {
  nonce: string;
  error?: string;
}

export interface WalletAuthProps {
  onAuthenticated: (user: User) => void;
  config: WalletAuthConfig;
  onError?: (error: Error) => void;
}

export interface ZeroBrixAuthProps {
  onAuthenticated: (walletAddress: string, user?: User) => void;
  config: WalletAuthConfig;
  onError?: (error: Error) => void;
}

export interface UserDetails {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface DatabaseInterface {
  initialize(): Promise<void>;
  findUser(walletAddress: string): Promise<User | null>;
  createUser(userData: NewUserData): Promise<User>;
  updateUser(walletAddress: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(walletAddress: string): Promise<boolean>;
  close(): Promise<void>;
}