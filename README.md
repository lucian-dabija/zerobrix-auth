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
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';

// IMPORTANT: Ensure your project's data directory exists
// You can do this in your project's setup script:
// mkdir -p data

export const dynamic = 'force-dynamic'; // This is important for Next.js route handlers

export const { GET, POST } = createWalletAuthHandler({
  // Optional: Custom database path
  dbPath: './data/users.db', // This path is relative to your project root
  
  // Optional: Custom validation
  customValidation: async (walletAddress: string) => {
    // Add your custom validation logic here
    return true;
  }
});
```

## Database Setup

The library uses SQLite for user storage. Ensure your project has the following setup:

1. Create a `data` directory in your project root:
```bash
mkdir -p data
```

2. Add the following to your `.gitignore`:
```
# SQLite database files
data/*.db
data/*.db-journal
data/*.db-wal
data/*.db-shm
```

3. Ensure the `data` directory has write permissions:
```bash
chmod 755 data
```

### Database Operations

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

If you need a custom database instance with a different path:

```typescript
import { SQLiteDatabase } from '@zerocat-software/zerobrix-auth/server';

// Create a custom instance with a specific path
const customDb = SQLiteDatabase.getInstance('./custom/path/users.db');

// Initialize it before use
await customDb.initialize();

// Use the custom instance
const user = await customDb.findUser(walletAddress);
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

### Using Types

Import types directly from the main package:

```typescript
import type { User, WalletAuthConfig } from '@zerocat-software/zerobrix-auth';

// Example usage in your auth page
import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth';

export default function AuthPage() {
  const handleAuthenticated = (user: User) => {
    console.log('Authenticated user:', user);
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        appName: "Your App",
        appDescription: "Secure authentication"
      }}
    />
  );
}
```

## Configuration Options

The `WalletAuthConfig` supports several customization options:

```typescript
import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';

export default function AuthPage() {
  return (
    <WalletAuth 
      onAuthenticated={(user) => {
        console.log('Authenticated user:', user);
      }}
      config={{
        // Basic configuration
        appName: "Your App",
        appDescription: "Secure authentication with ZeroBrix",
        
        // Theme colors
        theme: {
          primary: "blue",
          secondary: "teal"
        },
        
        // Custom logo
        logo: {
          src: "/your-logo.png",
          width: 40,
          height: 40
        },
        
        // Custom styling
        customStyles: {
          container: "bg-gradient-custom",
          card: "backdrop-blur-lg",
          button: "material-button",
          input: "material-input",
          select: "material-select"
        },
        
        // QR Code customization
        qrCode: {
          size: 256,
          level: "M",
          imageSettings: {
            src: "/logo.png",
            width: 40,
            height: 40,
            excavate: true
          }
        },
        
        // Timeouts (in milliseconds)
        timeouts: {
          authentication: 300000, // 5 minutes
          polling: 3000         // 3 seconds
        }
      }}
      onError={(error) => {
        console.error('Auth error:', error);
      }}
    />
  );
}
```

## Development vs Production

The library handles database initialization differently in development and production:

- In development: The database is created on-demand when the API routes are called
- In production: Ensure the `data` directory exists before deployment

For production deployments, add a build script to ensure the directory exists:

```json
{
  "scripts": {
    "prebuild": "mkdir -p data",
    "build": "next build"
  }
}

### Configuration Options Explained

#### Basic Configuration
- `appName`: Your application name (displayed in header)
- `appDescription`: Brief description of your app

#### Theme
- `theme.primary`: Primary color for gradients and highlights
- `theme.secondary`: Secondary color for gradients and accents

#### Logo
- `logo.src`: Path to your logo image
- `logo.width`: Logo width in pixels
- `logo.height`: Logo height in pixels

#### Custom Styles
- `customStyles.container`: Main container styling
- `customStyles.card`: Authentication card styling
- `customStyles.button`: Button styling
- `customStyles.input`: Input field styling
- `customStyles.select`: Select dropdown styling

#### QR Code
- `qrCode.size`: QR code size in pixels (default: 256)
- `qrCode.level`: Error correction level ('L', 'M', 'Q', 'H')
- `qrCode.imageSettings`: Logo overlay settings
  - `src`: Logo image path
  - `width`: Logo width
  - `height`: Logo height
  - `excavate`: Whether to make space for the logo

#### Timeouts
- `timeouts.authentication`: Overall auth timeout (default: 5 minutes)
- `timeouts.polling`: Interval between auth checks (default: 3 seconds)

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

BSD-3-Clause © ZEROCAT