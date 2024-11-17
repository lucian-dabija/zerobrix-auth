# @zerocat-software/zerobrix-auth

A complete authentication solution for ZeroBrix wallet authentication with integrated SQLite storage.

## Features

- 🔐 ZeroBrix wallet authentication
- 💾 Built-in SQLite user storage
- ⚛️ Ready-to-use React components
- 🎨 Tailwind CSS styling
- 📱 Mobile-responsive design
- 🔄 QR code & manual transaction support
- 💫 Modern animations with Framer Motion

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
import { createWalletAuthHandler, default as db } from '@zerocat-software/zerobrix-auth/server';

export const { GET, POST } = createWalletAuthHandler({
  // Optional: Custom database path (default is './data/users.db')
  dbPath: './data/custom-users.db',
  
  // Optional: Custom validation
  customValidation: async (walletAddress: string) => {
    const user = await db.findUser(walletAddress);
    return !!user;
  }
});
```

### 4. Authentication Page

Create `app/auth/page.tsx`:

```typescript
'use client';

import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth/types';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthenticated = (user: User) => {
    // Store authentication state
    localStorage.setItem('wallet_address', user.wallet_address);
    
    // Example: redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        appName: "Your App Name",
        appDescription: "Secure authentication with ZeroBrix",
        theme: {
          primary: "blue",
          secondary: "teal"
        },
        // Optional: Custom logo
        logo: {
          src: "/your-logo.png",
          width: 40,
          height: 40
        }
      }}
      onError={(error) => {
        console.error('Auth error:', error);
        // Handle error (e.g., show notification)
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
    // Add this line to include the library's components
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Your theme customizations
    }
  },
  plugins: []
};
```

## Database Usage

The library includes a SQLite database that automatically manages users. The database file is created at `./data/users.db` by default.

### Database Operations

```typescript
import { default as db } from '@zerocat-software/zerobrix-auth/server';

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

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Customization

### Component Styling

The library uses Tailwind CSS. Customize the appearance using the `customStyles` config:

```typescript
<WalletAuth 
  config={{
    customStyles: {
      container: "bg-gradient-custom min-h-screen",
      card: "backdrop-blur-lg bg-white/90",
      button: "bg-gradient-to-r from-primary to-secondary",
      input: "border-gray-300",
      select: "border-gray-300"
    }
  }}
/>
```

### Authentication Flow

The component handles:
1. QR code generation for mobile wallet scanning
2. Manual transaction instructions
3. User data collection for new users
4. Automatic database storage
5. Success/error handling

## Protected Routes

Create a middleware to protect your routes:

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
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    // Add other protected routes
  ],
};
```

## Common Issues

### SQLite Binary Missing
If you see SQLite-related errors, ensure you have the required build tools:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3

# macOS
xcode-select --install

# Windows
npm install --global windows-build-tools
```

### Authentication Timeout
The default timeout is 5 minutes. Handle the timeout in your error handler:

```typescript
<WalletAuth 
  onError={(error) => {
    if (error.message.includes('timeout')) {
      // Handle timeout specifically
    }
  }}
/>
```

### Database File Location
By default, the database is created in `./data/users.db`. Ensure this directory is:
- Created automatically by the package
- Included in `.gitignore`
- Has write permissions

## TypeScript Types

All types are exported from the package:

```typescript
import type { 
  User, 
  WalletAuthConfig,
  DatabaseInterface 
} from '@zerocat-software/zerobrix-auth/types';
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

BSD-3-Clause © ZEROCAT