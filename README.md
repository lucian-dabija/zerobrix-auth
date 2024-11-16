# ZEROBRIX Auth Implementation Guide

This guide will walk you through implementing ZEROCAT's wallet-based Web3 authentication in your Next.js application. 

## Installation

1. Install the ZEROBRIX Auth package and its peer dependencies:

```bash
# Install the main package
npm install @zerobrix/auth

# Install peer dependencies
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select
npm install tailwindcss lucide-react framer-motion qrcode.react
```

## Configuration

### 1. Environment Variables

Create or update your `.env.local` file with the required variables:

```env
# ZeroBrix API Configuration
ZEROBRIX_API_URL=https://brix.zerocat.one/api/v2
ZEROBRIX_API_KEY=your_api_key
AUTH_CONTRACT_ID=your_contract_id

# Public Variables
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID=your_token_id
```

### 2. Tailwind CSS Setup

Update your `tailwind.config.js` to include the required styles:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ... your existing content
    "./node_modules/@zerobrix/auth/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
      },
    },
  },
}
```

## Implementation

### 1. API Routes Setup

Create the authentication API route in your Next.js app:

```typescript
// app/api/wallet-auth/route.ts
import { createWalletAuthHandler } from '@zerobrix/auth/server';
import { db } from '@/lib/db'; // Your database instance

export const { GET, POST } = createWalletAuthHandler({
  // Validate existing users
  validateUser: async (walletAddress: string) => {
    try {
      const user = await db.findUser(walletAddress);
      return user;
    } catch (error) {
      console.error('User validation error:', error);
      return null;
    }
  },

  // Optional: Handle new user creation
  onNewUser: async (userData) => {
    try {
      await db.createUser(userData);
    } catch (error) {
      console.error('New user creation error:', error);
      throw error;
    }
  },

  // Optional: Add custom validation
  customValidation: async (walletAddress: string) => {
    // Add any custom validation logic
    return true;
  }
});
```

### 2. Frontend Implementation

Create your authentication page:

```typescript
// app/auth/page.tsx
'use client';

import { WalletAuth } from '@zerobrix/auth/react';
import type { User } from '@zerobrix/auth/types';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthenticated = (user: User) => {
    // Handle successful authentication
    console.log('Authenticated user:', user);
    
    // Store the wallet address
    localStorage.setItem('wallet_address', user.wallet_address);
    
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        appName: "Your App Name",
        appDescription: "Your App Description",
        theme: {
          primary: "blue",
          secondary: "teal"
        },
        logo: {
          src: "/your-logo.png",
          width: 40,
          height: 40
        },
        customStyles: {
          container: "your-container-class",
          card: "your-card-class",
          button: "your-button-class"
        }
      }}
    />
  );
}
```

### 3. Protected Routes

Create a middleware to protect your routes:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get wallet address from session/cookie
  const walletAddress = request.cookies.get('wallet_address')?.value;

  if (!walletAddress) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Validate user exists
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/users/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress })
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
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

## Advanced Usage

### Custom Styling

The library supports custom styling through Tailwind CSS classes:

```typescript
<WalletAuth 
  onAuthenticated={handleAuthenticated}
  config={{
    // ... other config
    customStyles: {
      container: "bg-gradient-custom min-h-screen",
      card: "backdrop-blur-lg bg-white/90",
      button: "bg-gradient-to-r from-purple-500 to-pink-500",
      input: "border-gray-300 focus:ring-purple-500",
      select: "border-gray-300 focus:ring-purple-500"
    }
  }}
/>
```

### Custom User Validation

Implement custom validation logic in your API handler:

```typescript
export const { GET, POST } = createWalletAuthHandler({
  validateUser: async (walletAddress: string) => {
    // Example: Check if user has required tokens
    const userBalance = await checkUserTokens(walletAddress);
    if (userBalance < 100) {
      throw new Error('Insufficient token balance');
    }

    // Example: Check user role/permissions
    const user = await db.findUser(walletAddress);
    if (user?.role !== 'allowed') {
      throw new Error('Unauthorized user role');
    }

    return user;
  },
});
```

### Error Handling

The library provides comprehensive error handling:

```typescript
<WalletAuth 
  onAuthenticated={handleAuthenticated}
  onError={(error) => {
    console.error('Authentication error:', error);
    // Handle error (e.g., show notification)
    toast.error(error.message);
  }}
  config={{
    // ... your config
  }}
/>
```

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data and API keys.

2. **Error Handling**: Implement proper error handling both on the frontend and backend.

3. **User Experience**: Provide clear feedback during the authentication process.

4. **Security**: Implement proper session management and token validation.

5. **Styling**: Use the theme configuration for consistent branding.

## Common Issues

### 1. QR Code Not Scanning

Ensure the QR code is properly sized and has sufficient contrast. You can customize the QR code size:

```typescript
config={{
  qrCode: {
    size: 256,
    level: "M",
    imageSettings: {
      width: 40,
      height: 40
    }
  }
}}
```

### 2. Authentication Timeouts

The default timeout is 5 minutes. You can customize it:

```typescript
config={{
  timeouts: {
    authentication: 300000, // 5 minutes in milliseconds
    polling: 3000 // Poll every 3 seconds
  }
}}
```

### 3. Mobile Responsiveness

The library is mobile-responsive by default, but you can customize the mobile experience:

```typescript
config={{
  customStyles: {
    container: "px-4 md:px-0",
    card: "w-full max-w-md mx-auto"
  },
  mobileView: {
    enabled: true,
    breakpoint: "md" // Tailwind breakpoint
  }
}}
```

## Support

For issues and feature requests, please visit our GitHub repository or contact ZEROCAT support.