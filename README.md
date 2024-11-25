# @zerocat-software/zerobrix-auth

A simple and reliable authentication solution for Next.js applications using ZeroBrix wallet. Perfect for projects that need secure, blockchain-based authentication without the complexity.

![ZEROCAT Banner](./banner.png)

## What is This Library?

This library helps you add ZeroBrix wallet authentication to your Next.js website. Users can scan a QR code with their ZeroWallet app to log in, and their information is stored locally in a JSON file - no complex database setup needed!

## Features At a Glance

- 📱 Login with QR code scan
- 👤 User profile management
- ⚡ Works with Next.js 13+ and App Router
- 🎨 Pre-built UI components with Tailwind CSS
- 🔄 Automatic page refresh after login
- 💾 Simple JSON file storage (no database needed!)

## Step-by-Step Setup Guide

### 1. Install the Package

First, install the library and its required dependencies:

```bash
# Using npm
npm install @zerocat-software/zerobrix-auth @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select lucide-react framer-motion qrcode.react

# Or using pnpm
pnpm add @zerocat-software/zerobrix-auth @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select lucide-react framer-motion qrcode.react
```

### 2. Set Up Environment Variables

Create or update your `.env.local` file with your ZeroBrix credentials:

```env
# Required settings - you'll get these from ZeroBrix
ZEROBRIX_API_URL=https://brix.zerocat.one/api/v2
ZEROBRIX_API_KEY=your_api_key
AUTH_CONTRACT_ID=your_contract_id
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID=your_token_id
```

### 3. Create the Authentication API Route

Create a new file at `app/api/wallet-auth/route.ts`:

```typescript
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';

// This line is important for Next.js!
export const dynamic = 'force-dynamic';

// Create and export the API route handlers
export const { GET, POST } = createWalletAuthHandler({
  // Optional: Add custom validation if needed
  customValidation: async (walletAddress: string) => {
    // For example, check if the wallet is whitelisted
    return true; // Allow all wallets by default
  }
});
```

### 4. Create Your Login Page

Create a new file at `app/auth/page.tsx`:

```typescript
'use client';

import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // This function runs after successful authentication
  const handleAuthenticated = (user: User) => {
    // Save the wallet address for later use
    localStorage.setItem('wallet_address', user.wallet_address);
    
    // Redirect to dashboard or home page
    router.push('/dashboard');
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        // Your app's information
        appName: "My Amazing App",
        appDescription: "Login with ZeroWallet",
        
        // Enable automatic page refresh after login
        refreshPageOnAuth: true,
        
        // Choose your colors (uses Tailwind CSS colors)
        theme: {
          primary: "blue",
          secondary: "teal"
        },

        // How long to wait for authentication
        timeouts: {
          authentication: 300000, // 5 minutes total
          polling: 3000          // Check every 3 seconds
        }
      }}
      // Handle any errors that occur
      onError={(error) => {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }}
    />
  );
}
```

### 5. Update Tailwind Config

Add the library's components to your Tailwind configuration (`tailwind.config.js`):

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Add this line to include the library's components:
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
```

## Working with User Data

All user data is stored in a simple JSON file. Here's how to work with it:

### Finding a User

```typescript
import { db } from '@zerocat-software/zerobrix-auth/server';

// In your API route or server component:
async function getUser(walletAddress: string) {
  const user = await db.findUser(walletAddress);
  if (user) {
    console.log('Found user:', user.first_name, user.last_name);
  }
  return user;
}
```

### Creating a New User

```typescript
async function createNewUser() {
  const newUser = await db.createUser({
    wallet_address: '0x123...',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'User'  // or 'Admin'
  });
  
  console.log('Created new user:', newUser);
}
```

### Updating User Details

```typescript
async function updateUserEmail(walletAddress: string, newEmail: string) {
  const updated = await db.updateUser(walletAddress, {
    email: newEmail
  });
  
  if (updated) {
    console.log('Updated user email');
  }
}
```

## Protecting Your Pages

To make sure only logged-in users can access certain pages, create a middleware file:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if user is logged in
  const walletAddress = request.cookies.get('wallet_address')?.value;

  if (!walletAddress) {
    // Not logged in? Redirect to login page
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Logged in? Continue to page
  return NextResponse.next();
}

// Which pages should be protected?
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    // Add more protected routes here
  ]
};
```

## Customizing the Look and Feel

### Colors and Theme

```typescript
const config = {
  theme: {
    primary: "indigo",    // Main color
    secondary: "purple"   // Accent color
  }
};
```

You can use any Tailwind CSS color name like: red, blue, green, yellow, purple, pink, etc.

### Custom Styles

```typescript
const config = {
  customStyles: {
    // Add extra classes to each element
    container: "bg-gradient-to-r from-slate-900 to-slate-800",
    card: "shadow-xl border border-gray-800",
    button: "hover:scale-105 transition-transform",
    input: "focus:ring-2 focus:ring-purple-500",
    select: "cursor-pointer hover:border-purple-500"
  }
};
```

### QR Code Appearance

```typescript
const config = {
  qrCode: {
    size: 256,              // Size in pixels
    level: "M",            // Error correction level
    imageSettings: {
      src: "/your-logo.png", // Add your logo in the center
      height: 40,
      width: 40,
      excavate: true      // Clear space for logo
    }
  }
};
```

## Common Issues and Solutions

### 1. "Component not found" Error
Make sure you've installed all peer dependencies:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select lucide-react framer-motion qrcode.react
```

### 2. Styling Issues
If Tailwind styles aren't working, check your `tailwind.config.js` includes the library's path:
```javascript
content: [
  "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
]
```

### 3. Data Storage Issues
Make sure your `data` directory exists and has write permissions:
```bash
# Create data directory
mkdir data

# Set permissions (Linux/Mac)
chmod 755 data
```

## Need Help?

- 🐛 Found a bug? [Open an issue](https://github.com/lucian-dabija/zerobrix-auth/issues)
- 📧 Need support? Email us at contact@zerocat.art
- 🚀 Want to contribute? PRs are welcome!

## License

BSD-3-Clause © ZEROCAT

---

Made with ❤️ by ZEROCAT