// src/types/index.ts

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
    };
  }
  
  export interface WalletAuthHandlerConfig {
    validateUser: (walletAddress: string) => Promise<User | null>;
    onNewUser?: (user: NewUserData) => Promise<void>;
    customValidation?: (walletAddress: string) => Promise<boolean>;
  }
  
  export interface AuthResponse {
    authenticated: boolean;
    userAddress?: string;
    error?: string;
  }
  
  export interface NonceResponse {
    nonce: string;
    error?: string;
  }
  
  export interface WalletAuthProps {
    onAuthenticated: (user: User) => void;
    config: WalletAuthConfig;
  }
  
  export interface ZeroBrixAuthProps {
    onAuthenticated: (walletAddress: string) => void;
    config: WalletAuthConfig;
  }
  
  export interface UserDetails {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }
