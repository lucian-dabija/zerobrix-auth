# ZeroBrix Auth - Technical Implementation Guide

## Table of Contents
1. [Installation Requirements](#installation-requirements)
2. [Project Structure Setup](#project-structure-setup)
3. [Environment Configuration](#environment-configuration)
4. [API Route Configuration](#api-route-configuration)
5. [Provider Implementation](#provider-implementation)
6. [Authentication Flow](#authentication-flow)
7. [Database Management](#database-management)
8. [Type Definitions](#type-definitions)
9. [Advanced Configurations](#advanced-configurations)
10. [Error Handling](#error-handling)

## Installation Requirements

### Required Dependencies
```bash
# Core library
npm install @zerocat-software/zerobrix-auth

# Required peer dependencies
npm install @radix-ui/react-dialog @radix-ui/react-label \
            @radix-ui/react-select @radix-ui/react-tabs \
            framer-motion lucide-react qrcode.react
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Required: Define color scales for your theme
        primary: {
          50: 'rgb(var(--primary-50))',
          // ... other shades
          950: 'rgb(var(--primary-950))',
        },
        secondary: {
          50: 'rgb(var(--secondary-50))',
          // ... other shades
          950: 'rgb(var(--secondary-950))',
        }
      }
    }
  }
}
```

## Project Structure Setup

### Recommended File Structure
```
your-nextjs-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── route.ts   # Authentication API routes
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx
├── data/                  # Created automatically for encrypted DB
│   ├── .gitkeep
│   └── .gitignore
├── components/
└── lib/
    └── auth.ts           # Optional: Auth utility functions
```

### Data Directory Setup
The library automatically creates and manages the `data` directory, but you can pre-configure it:

```bash
mkdir -p data
touch data/.gitkeep
echo "*.json\n!.gitkeep" > data/.gitignore
chmod 755 data
```

## Environment Configuration

### Required Environment Variables
Create `.env.local` with all required configurations:

```env
# API Configuration
ZEROBRIX_API_URL="https://brix.zerocat.one/api/v2"
ZEROBRIX_API_KEY="your_api_key"
AUTH_CONTRACT_ID="your_contract_id"

# Public Variables (Available in browser)
NEXT_PUBLIC_SERVER_WALLET_ADDRESS="0x..."
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID="your_token_id"

# Database Encryption (32-byte hex string)
DB_ENCRYPTION_KEY="your_random_32_byte_hex_string"
```

### Generating Secure Keys
```typescript
// script/generate-keys.ts
import { randomBytes } from 'crypto';

const encryptionKey = randomBytes(32).toString('hex');
console.log('DB_ENCRYPTION_KEY:', encryptionKey);
```

## API Route Configuration

### Basic Auth Route
```typescript
// app/api/auth/route.ts
import { createAuthApiHandler } from '@zerocat-software/zerobrix-auth';
import { NextRequest } from 'next/server';

// Required for dynamic routes
export const dynamic = 'force-dynamic';

// Custom validation type
type ValidationResult = Promise<{
  isValid: boolean;
  error?: string;
}>;

// Create handler with validation
export const { GET, POST } = createAuthApiHandler({
  customValidation: async (walletAddress: string): ValidationResult => {
    if (!walletAddress.startsWith('0x')) {
      return {
        isValid: false,
        error: 'Invalid wallet address format'
      };
    }

    // Example: Check against whitelist
    const whitelist = process.env.WALLET_WHITELIST?.split(',') || [];
    return {
      isValid: whitelist.length === 0 || whitelist.includes(walletAddress),
      error: 'Wallet not whitelisted'
    };
  }
});
```

### Advanced Auth Route with Rate Limiting
```typescript
// app/api/auth/route.ts
import { createAuthApiHandler } from '@zerocat-software/zerobrix-auth';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting map
const rateLimiter = new Map<string, { count: number; timestamp: number }>();

// Rate limit middleware
const checkRateLimit = (req: NextRequest) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // requests per window

  const current = rateLimiter.get(ip) || { count: 0, timestamp: now };
  
  if (now - current.timestamp > windowMs) {
    current.count = 0;
    current.timestamp = now;
  }
  
  current.count++;
  rateLimiter.set(ip, current);

  return current.count <= maxRequests;
};

export const { GET, POST } = createAuthApiHandler({
  customValidation: async (walletAddress: string) => {
    // Your validation logic
    return true;
  },
  beforeRequest: async (req: NextRequest) => {
    if (!checkRateLimit(req)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
    }
    return null; // Continue with request
  }
});
```

## Provider Implementation

### Basic Provider Setup
```typescript
// app/layout.tsx
import { AuthProvider } from '@zerocat-software/zerobrix-auth';
import type { User } from '@zerocat-software/zerobrix-auth';

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AuthProvider
          config={{
            appName: "Your App",
            appDescription: "Secure login with ZeroWallet",
            theme: {
              primary: "blue",
              secondary: "teal"
            },
            // Authentication timeouts
            timeouts: {
              authentication: 5 * 60 * 1000, // 5 minutes
              polling: 3000 // 3 seconds
            }
          }}
          onAuthSuccess={(user: User) => {
            console.log('Authentication successful', user);
          }}
          onAuthError={(error: Error) => {
            console.error('Authentication failed', error);
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Advanced Provider Configuration
```typescript
// app/layout.tsx
import { AuthProvider } from '@zerocat-software/zerobrix-auth';

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AuthProvider
          config={{
            appName: "Your App",
            appDescription: "Secure login with ZeroWallet",
            
            // Styling configuration
            theme: {
              primary: "blue",
              secondary: "teal"
            },
            customStyles: {
              container: "backdrop-blur-xl",
              card: "shadow-2xl border-white/10",
              button: "hover:scale-105 transition-all",
              input: "focus:ring-2 focus:ring-blue-500"
            },
            
            // Onboarding configuration
            onboardingFields: {
              allowCompany: true,
              requireName: true,
              requireEmail: true,
              companyNameRequired: true,
              availableRoles: [
                "User",
                "Admin",
                "Developer"
              ]
            },
            
            // Authentication behavior
            refreshPageOnAuth: true,
            redirectPath: "/dashboard",
            modalMode: true,
            
            // Timeouts
            timeouts: {
              authentication: 300000,
              polling: 3000
            }
          }}
          onAuthSuccess={(user) => {
            // Custom success handling
          }}
          onAuthError={(error) => {
            // Custom error handling
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Authentication Flow

### Protecting Routes
```typescript
// app/protected/page.tsx
'use client';

import { withAuth, useAuth } from '@zerocat-software/zerobrix-auth';
import { useEffect } from 'react';

function ProtectedPage() {
  const { user, isAuthenticated, logout, showAuthModal } = useAuth();

  useEffect(() => {
    // Optional: Custom authentication check
    if (!isAuthenticated) {
      showAuthModal();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Or loading state
  }

  return (
    <div>
      <h1>Protected Content</h1>
      {user?.company_name ? (
        // Company view
        <div>
          <p>Company: {user.company_name}</p>
          <p>Role: {user.role}</p>
        </div>
      ) : (
        // Individual view
        <div>
          <p>Welcome {user?.first_name} {user?.last_name}</p>
          <p>Email: {user?.email}</p>
        </div>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default withAuth(ProtectedPage);
```

### Manual Authentication Control
```typescript
// components/LoginButton.tsx
'use client';

import { useAuth } from '@zerocat-software/zerobrix-auth';

export function LoginButton() {
  const { showAuthModal, isAuthenticated, user } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.first_name || user?.company_name}</p>
          <button onClick={() => logout()}>Logout</button>
        </div>
      ) : (
        <button onClick={() => showAuthModal()}>
          Login with ZeroWallet
        </button>
      )}
    </div>
  );
}
```

## Database Management

### User Schema
```typescript
interface User {
  wallet_address: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  role: string;
  created_at: string;
}
```

### Custom Database Interactions
```typescript
// lib/auth.ts
import { db } from '@zerocat-software/zerobrix-auth/server';

export async function findUserByEmail(email: string) {
  await db.initialize();
  const users = await db.findAll();
  return users.find(u => u.email === email);
}

export async function updateUserRole(
  walletAddress: string,
  newRole: string
) {
  await db.initialize();
  return db.updateUser(walletAddress, { role: newRole });
}
```

## Type Definitions

### Available Types
```typescript
import type {
  User,
  NewUserData,
  UserDetails,
  WalletAuthConfig,
  AuthProviderProps,
  WalletAuthProps,
  ZeroBrixAuthProps,
  AuthResponse,
  NonceResponse
} from '@zerocat-software/zerobrix-auth';

// Example usage with user details
const userDetails: UserDetails = {
  first_name: "John",
  last_name: "Doe",
  company_name: "",
  email: "john@example.com",
  role: "User"
};
```

## Advanced Configurations

### Custom Validation with Database Check
```typescript
export const { GET, POST } = createAuthApiHandler({
  async customValidation(walletAddress: string) {
    // Initialize database
    await db.initialize();
    
    // Check if user exists
    const user = await db.findUser(walletAddress);
    if (!user) {
      // Allow new users
      return true;
    }
    
    // Check user status
    if (user.role === 'banned') {
      return false;
    }
    
    // Additional checks
    if (user.email?.endsWith('@company.com')) {
      return true;
    }
    
    return false;
  }
});
```

### Custom Error Handler
```typescript
<AuthProvider
  config={{...}}
  onAuthError={(error) => {
    // Log to service
    logError({
      type: 'auth_error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Show custom notification
    toast.error('Authentication failed. Please try again.');
    
    // Optional: Report to monitoring service
    reportError(error);
  }}
>
```

## Error Handling

### Common Error Scenarios
```typescript
'use client';

import { withAuth, useAuth } from '@zerocat-software/zerobrix-auth';
import { useEffect } from 'react';

function ProtectedComponent() {
  const { user, error, isLoading } = useAuth();

  useEffect(() => {
    if (error) {
      switch (error.message) {
        case 'WALLET_NOT_FOUND':
          // Handle new user
          break;
        case 'VALIDATION_FAILED':
          // Handle validation failure
          break;
        case 'DATABASE_ERROR':
          // Handle database issues
          break;
        default:
          // Handle unknown errors
          console.error('Auth error:', error);
      }
    }
  }, [error]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return <div>Protected Content</div>;
}

export default withAuth(ProtectedComponent);
```

### Error Boundaries
```typescript
// components/AuthErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth error caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Authentication Error</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <AuthErrorBoundary>
      <ProtectedContent />
    </AuthErrorBoundary>
  );
}
```

## Security Considerations

### Database Encryption
The library uses AES-256-GCM for database encryption. Here's how it works:

```typescript
// Internal encryption process (for reference)
function encryptData(data: string, key: Buffer): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    authTag: authTag.toString('hex')
  };
}
```

### Protecting API Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session/edge';

export async function middleware(request: NextRequest) {
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== process.env.ZEROBRIX_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
```

## Advanced User Management

### Custom User Service
```typescript
// lib/services/user-service.ts
import { db } from '@zerocat-software/zerobrix-auth/server';
import type { User, NewUserData } from '@zerocat-software/zerobrix-auth';

export class UserService {
  private static instance: UserService;
  
  private constructor() {}
  
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
  
  async initialize() {
    await db.initialize();
  }
  
  async findByWallet(walletAddress: string): Promise<User | null> {
    await this.initialize();
    return db.findUser(walletAddress);
  }
  
  async createUser(userData: NewUserData): Promise<User> {
    await this.initialize();
    
    // Additional validation
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }
    
    return db.createUser(userData);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    await this.initialize();
    const users = await db.findAll();
    return users.find(u => u.email === email) || null;
  }
  
  async updateUser(
    walletAddress: string,
    updates: Partial<User>
  ): Promise<User | null> {
    await this.initialize();
    return db.updateUser(walletAddress, updates);
  }
}

export const userService = UserService.getInstance();
```

### Role-Based Access Control
```typescript
// lib/auth/rbac.ts
import { User } from '@zerocat-software/zerobrix-auth';

type Permission = 'read' | 'write' | 'admin';

const rolePermissions: Record<string, Permission[]> = {
  'User': ['read'],
  'Editor': ['read', 'write'],
  'Admin': ['read', 'write', 'admin']
};

export function hasPermission(
  user: User,
  requiredPermission: Permission
): boolean {
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(requiredPermission);
}

// Usage with HOC
export function withPermission(permission: Permission) {
  return function (WrappedComponent: React.ComponentType) {
    return function WithPermissionComponent(props: any) {
      const { user } = useAuth();
      
      if (!user || !hasPermission(user, permission)) {
        return <div>Access Denied</div>;
      }
      
      return <WrappedComponent {...props} />;
    };
  };
}

// Example usage
const AdminPanel = withPermission('admin')(
  withAuth(YourAdminComponent)
);
```

## Testing

### Setting Up Test Environment
```typescript
// jest.setup.ts
import '@testing-library/jest-dom';

// Mock environment variables
process.env.ZEROBRIX_API_KEY = 'test_key';
process.env.ZEROBRIX_API_URL = 'http://localhost:3000/api';
process.env.AUTH_CONTRACT_ID = 'test_contract';
process.env.DB_ENCRYPTION_KEY = 'test'.repeat(8); // 32 bytes

// Mock database
jest.mock('@zerocat-software/zerobrix-auth/server', () => ({
  db: {
    initialize: jest.fn(),
    findUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn()
  }
}));
```

### Component Testing
```typescript
// __tests__/auth.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '@zerocat-software/zerobrix-auth';

describe('Authentication Flow', () => {
  it('shows auth modal for protected content', async () => {
    const TestComponent = () => {
      const { isAuthenticated, showAuthModal } = useAuth();
      return (
        <div>
          {!isAuthenticated && (
            <button onClick={showAuthModal}>Login</button>
          )}
        </div>
      );
    };

    render(
      <AuthProvider config={{
        appName: "Test App",
        appDescription: "Test Description"
      }}>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(
      await screen.findByText('Scan QR Code')
    ).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Lazy Loading
```typescript
// app/layout.tsx
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(
  () => import('@zerocat-software/zerobrix-auth')
    .then(mod => mod.AuthProvider),
  {
    ssr: false,
    loading: () => <div>Loading auth...</div>
  }
);

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AuthProvider config={{...}}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Caching Strategies
```typescript
// lib/cache.ts
export const authCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

export function getCachedData<T>(
  key: string,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes
): T | null {
  const cached = authCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > ttlMs) {
    authCache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCachedData(
  key: string,
  data: any
): void {
  authCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Usage in API route
export const { GET, POST } = createAuthApiHandler({
  customValidation: async (walletAddress: string) => {
    // Check cache first
    const cached = getCachedData<boolean>(
      `validation_${walletAddress}`
    );
    if (cached !== null) return cached;

    // Perform validation
    const isValid = await performValidation(walletAddress);
    
    // Cache result
    setCachedData(`validation_${walletAddress}`, isValid);
    
    return isValid;
  }
});
```

## Migration Guide

### From v1.x to v2.x

1. Update Provider Configuration:
```typescript
// Old (v1.x)
<AuthProvider
  apiKey={process.env.ZEROBRIX_API_KEY}
  contractId={process.env.AUTH_CONTRACT_ID}
  onAuthenticated={handleAuth}
>

// New (v2.x)
<AuthProvider
  config={{
    appName: "Your App",
    appDescription: "Login Description",
    theme: {
      primary: "blue",
      secondary: "teal"
    }
  }}
  onAuthSuccess={handleAuth}
>
```

2. Update API Routes:
```typescript
// Old (v1.x)
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth';

// New (v2.x)
import { createAuthApiHandler } from '@zerocat-software/zerobrix-auth';
```

3. Update Database Usage:
```typescript
// Old (v1.x)
import { JSONDatabase } from '@zerocat-software/zerobrix-auth';

// New (v2.x)
import { db } from '@zerocat-software/zerobrix-auth/server';
```

## Deployment Considerations

### Environment Setup
```bash
# Production environment variables
ZEROBRIX_API_URL="https://brix.zerocat.one/api/v2"
ZEROBRIX_API_KEY="prod_key"
AUTH_CONTRACT_ID="prod_contract"
DB_ENCRYPTION_KEY="production_encryption_key"

# Ensure data directory permissions
mkdir -p /var/www/app/data
chown www-data:www-data /var/www/app/data
chmod 755 /var/www/app/data
```

### Database Backup
```typescript
// scripts/backup-db.ts
import fs from 'fs/promises';
import path from 'path';

async function backupDatabase() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
    
  const dbPath = path.join(
    process.cwd(),
    'data',
    'zerobrix-users.encrypted.json'
  );
  
  const backupPath = path.join(
    process.cwd(),
    'backups',
    `db-${timestamp}.json`
  );
  
  await fs.copyFile(dbPath, backupPath);
  
  console.log(`Backup created: ${backupPath}`);
}

backupDatabase().catch(console.error);
```

## Contributing Guidelines

1. Fork the repository
2. Create feature branch
3. Install dependencies:
```bash
pnpm install
```

4. Run tests:
```bash
pnpm test
```

5. Build:
```bash
pnpm build
```

6. Submit PR with:
- Clear description
- Test coverage
- Documentation updates
- Migration notes if needed

## Support Resources

- Email: support@zerocat.art
- Website: https://www.zerocat.art
- LinkedIn: https://linkedin.com/company/zerocat
- Journal: https://www.zerocat.one/journal

---

For more examples and updates, visit our [GitHub repository](https://github.com/zerocat-software/zerobrix-auth).