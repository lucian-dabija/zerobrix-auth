# @zerocat-software/zerobrix-auth

A complete authentication solution for ZeroBrix with integrated SQLite user storage.

## Features

- ZeroBrix wallet authentication
- Built-in SQLite user storage
- React components for authentication flow
- TypeScript support
- Customizable styling with Tailwind CSS

## Installation

```bash
pnpm add @zerocat-software/zerobrix-auth
```

### Required peer dependencies
```bash
pnpm add @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select \
        lucide-react framer-motion qrcode.react tailwindcss
```

## Basic Usage

1. Set up environment variables in your `.env.local`:

```env
ZEROBRIX_API_URL=https://brix.zerocat.one/api/v2
ZEROBRIX_API_KEY=your_api_key
AUTH_CONTRACT_ID=your_contract_id
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID=your_token_id
```

2. Create the authentication API route:

```typescript
// app/api/wallet-auth/route.ts
import { createWalletAuthHandler, defaultDb } from '@zerocat-software/zerobrix-auth/server';

export const { GET, POST } = createWalletAuthHandler({
  // Optional: Custom database path
  dbPath: './data/users.db',
  
  // Optional: Custom validation
  customValidation: async (walletAddress: string) => {
    const user = await defaultDb.findUser(walletAddress);
    return !!user;
  }
});
```

3. Use the authentication component:

```typescript
// app/auth/page.tsx
'use client';

import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth/types';

export default function AuthPage() {
  const handleAuthenticated = (user: User) => {
    console.log('Authenticated user:', user);
    // Handle successful authentication
    // e.g., store user data, redirect, etc.
  };

  return (
    <WalletAuth 
      onAuthenticated={handleAuthenticated}
      config={{
        appName: "Your App",
        appDescription: "Secure authentication with ZeroBrix",
        theme: {
          primary: "blue",
          secondary: "teal"
        }
      }}
      onError={(error) => {
        console.error('Authentication error:', error);
        // Handle error (e.g., show toast notification)
      }}
    />
  );
}
```

## Database Usage

### Using the Default Database Instance

```typescript
import { defaultDb } from '@zerocat-software/zerobrix-auth/server';

// Find a user
const user = await defaultDb.findUser(walletAddress);

// Create a user
const newUser = await defaultDb.createUser({
  wallet_address: '0x...',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  role: 'User'
});
```

### Creating a Custom Database Instance

```typescript
import { SQLiteDatabase } from '@zerocat-software/zerobrix-auth/server';

const db = SQLiteDatabase.getInstance('./custom/path/users.db');

// Initialize the database (creates tables if they don't exist)
await db.initialize();

// Use the database
const user = await db.findUser(walletAddress);
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

### Available Database Operations

```typescript
import { defaultDb } from '@zerocat-software/zerobrix-auth/server';
import type { User } from '@zerocat-software/zerobrix-auth/types';

// Find user
const user = await defaultDb.findUser(walletAddress);

// Create user
const newUser = await defaultDb.createUser({
  wallet_address: '0x...',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  role: 'User'
});

// Update user
const updatedUser = await defaultDb.updateUser(walletAddress, {
  email: 'newemail@example.com'
});

// Delete user
const deleted = await defaultDb.deleteUser(walletAddress);
```

## Customization

### Styling

The library uses Tailwind CSS for styling. Add the component paths to your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ... your existing paths
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ],
  // ... rest of your config
}
```

You can customize the appearance using the `customStyles` config:

```typescript
<WalletAuth 
  config={{
    customStyles: {
      container: "your-container-class",
      card: "your-card-class",
      button: "your-button-class",
      input: "your-input-class",
      select: "your-select-class"
    }
  }}
/>
```

### Error Handling

Handle authentication and database errors:

```typescript
<WalletAuth 
  onAuthenticated={(user) => {
    // Success handler
  }}
  onError={(error) => {
    // Error handler
    console.error('Auth error:', error);
    // Show error notification, etc.
  }}
/>
```

## Data Migration

If you need to migrate existing user data:

```typescript
import { defaultDb } from '@zerocat-software/zerobrix-auth/server';
import type { NewUserData } from '@zerocat-software/zerobrix-auth/types';

async function migrateUsers(existingUsers: NewUserData[]) {
  await defaultDb.initialize();
  
  for (const user of existingUsers) {
    try {
      await defaultDb.createUser(user);
    } catch (error) {
      console.error(`Failed to migrate user ${user.wallet_address}:`, error);
    }
  }
}
```

## Security Considerations

- The library uses SQLite's prepared statements to prevent SQL injection
- All user data is sanitized before storage
- The database file is created with appropriate permissions
- Wallet addresses are validated before storage

## Known Limitations

- SQLite is used in a file-based mode, suitable for small to medium applications
- For high-concurrency scenarios, consider implementing a custom database adapter

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

BSD-3-Clause © ZEROCAT