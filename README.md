# @zerocat-software/zerobrix-auth

A complete authentication solution for ZeroBrix wallet authentication with integrated SQLite storage.

![ZEROCAT Banner](./banner.png)

## Features

- 🔐 ZeroBrix wallet authentication
- 💾 Built-in SQLite user storage
- ⚛️ Ready-to-use React components
- 🎨 Tailwind CSS styling
- 📱 Mobile-responsive design
- 🔄 QR code & manual transaction support
- 💫 Modern animations with Framer Motion
- 🔄 Automatic page refresh support
- 👤 Smooth new user onboarding
- 🎯 Optimized polling behavior

## Quick Start

### 1. Installation

```bash
# Using pnpm (recommended)
pnpm add @zerocat-software/zerobrix-auth

# Install peer dependencies
pnpm add @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select \
        lucide-react framer-motion qrcode.react tailwindcss
```

### 2. Environment Setup

Create or update your `.env.local`:

```env
# Required ZeroBrix configuration
ZEROBRIX_API_URL=https://brix.zerocat.one/api/v2
ZEROBRIX_API_KEY=your_api_key
AUTH_CONTRACT_ID=your_contract_id
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID=your_token_id
```

### 3. API Route Setup

Create `app/api/wallet-auth/route.ts`:

```typescript
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';

export const dynamic = 'force-dynamic';

export const { GET, POST } = createWalletAuthHandler({
  // Optional: Custom database path
  dbPath: './data/users.db',
  
  // Optional: Custom validation
  customValidation: async (walletAddress: string) => {
    // Add your custom validation logic here
    return true;
  }
});
```

### 4. Authentication Component Setup

Create your authentication page (`app/auth/page.tsx`):

```typescript
'use client';

import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthenticated = (user: User) => {
    localStorage.setItem('wallet_address', user.wallet_address);
    router.push('/dashboard');
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        appName: "Your App Name",
        appDescription: "Secure authentication with ZeroBrix",
        refreshPageOnAuth: true, // Enable automatic page refresh
        theme: {
          primary: "blue",
          secondary: "teal"
        },
        timeouts: {
          authentication: 300000, // 5 minutes
          polling: 3000        // 3 seconds
        }
      }}
      onError={(error) => {
        console.error('Auth error:', error);
      }}
    />
  );
}
```

### 5. Tailwind Configuration

Update your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

## Configuration Options

### WalletAuth Component

```typescript
interface WalletAuthConfig {
  // Basic Configuration
  appName: string;
  appDescription: string;
  
  // Theme Configuration
  theme?: {
    primary: string;    // Tailwind color name
    secondary: string;  // Tailwind color name
  };
  
  // Logo Configuration (optional)
  logo?: {
    src: string;
    width: number;
    height: number;
  };
  
  // Custom Styling
  customStyles?: {
    container?: string;  // Container class names
    card?: string;      // Card class names
    button?: string;    // Button class names
    input?: string;     // Input field class names
    select?: string;    // Select dropdown class names
  };
  
  // Behavior Configuration
  refreshPageOnAuth?: boolean;  // Auto refresh after auth
  timeouts?: {
    authentication?: number;  // Overall timeout (ms)
    polling?: number;        // Polling interval (ms)
  };
  
  // QR Code Configuration
  qrCode?: {
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    imageSettings?: {
      src?: string;
      height?: number;
      width?: number;
      excavate?: boolean;
    };
  };
}
```

### Server Handler Configuration

```typescript
interface WalletAuthHandlerConfig {
  // Custom user validation
  validateUser?: (walletAddress: string) => Promise<User | null>;
  
  // New user callback
  onNewUser?: (user: NewUserData) => Promise<void>;
  
  // Custom validation logic
  customValidation?: (walletAddress: string) => Promise<boolean>;
  
  // Database configuration
  dbPath?: string;
}
```

## Database Operations

### Basic CRUD Operations

```typescript
import { db } from '@zerocat-software/zerobrix-auth/server';

// Find a user
const user = await db.findUser(walletAddress);

// Create a user
const newUser = await db.createUser({
  wallet_address: '0x...',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  role: 'User'
});

// Update a user
const updatedUser = await db.updateUser(walletAddress, {
  email: 'new-email@example.com'
});

// Delete a user
const deleted = await db.deleteUser(walletAddress);
```

### Custom Database Instance

```typescript
import { SQLiteDatabase } from '@zerocat-software/zerobrix-auth/server';

const customDb = SQLiteDatabase.getInstance('./custom/path/users.db');
await customDb.initialize();

// Use custom instance
const user = await customDb.findUser(walletAddress);
```

## Advanced Features

### 1. New User Onboarding

The library provides a smooth onboarding experience for new users:

- Automatic detection of new users
- Form-based data collection
- Optimized polling behavior during registration
- Seamless transition to authenticated state

### 2. Authentication Flow

1. **Initial QR Code Generation**
   - Secure nonce generation
   - QR code display with custom logo
   - Mobile-friendly scanning

2. **Transaction Verification**
   - Smart contract interaction
   - Automatic polling with configurable intervals
   - Error handling and retry mechanisms

3. **User Management**
   - Automatic user creation for new wallets
   - Role-based access control
   - Optional email collection

### 3. Page Refresh Behavior

Control page refresh behavior after authentication:

```typescript
<WalletAuth 
  config={{
    refreshPageOnAuth: true,  // Enable auto-refresh
    timeouts: {
      authentication: 300000, // 5 minutes
      polling: 3000          // 3 seconds
    }
  }}
/>
```

### 4. Protected Routes

Implement route protection with middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const walletAddress = request.cookies.get('wallet_address')?.value;

  if (!walletAddress) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

## Styling and Customization

### 1. Theme Customization

```typescript
const config = {
  theme: {
    primary: "blue",     // Any Tailwind color
    secondary: "teal"    // Any Tailwind color
  }
};
```

### 2. Custom Styles

```typescript
const config = {
  customStyles: {
    container: "bg-gradient-custom min-h-screen",
    card: "backdrop-blur-lg bg-white/90",
    button: "bg-gradient-to-r from-primary to-secondary",
    input: "border-gray-300",
    select: "border-gray-300"
  }
};
```

### 3. QR Code Customization

```typescript
const config = {
  qrCode: {
    size: 256,
    level: "M",
    imageSettings: {
      src: "/logo.png",
      height: 40,
      width: 40,
      excavate: true
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **SQLite Binary Missing**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential python3

   # macOS
   xcode-select --install

   # Windows
   npm install --global windows-build-tools
   ```

2. **Authentication Timeout**
   - Increase timeout values in config
   - Check network connectivity
   - Verify environment variables

3. **Database Permissions**
   - Ensure write permissions on data directory
   - Check file ownership
   - Verify path configuration

### Best Practices

1. **Security**
   - Always use HTTPS in production
   - Implement proper role validation
   - Secure environment variables

2. **Performance**
   - Optimize polling intervals
   - Use appropriate timeout values
   - Enable page caching where appropriate

3. **User Experience**
   - Provide clear error messages
   - Show loading states
   - Implement proper validation feedback

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

BSD-3-Clause © ZEROCAT

## Support

- Issues: [GitHub Issues](https://github.com/lucian-dabija/zerobrix-auth/issues)
- Email: contact@zerocat.art