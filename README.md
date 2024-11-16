# @zerocat-software/zerobrix-auth

A core, standalone authentication solution for ZeroBrix Wallet Authentication (Signed Transaction) with integrated SQLite user storage.

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

## Basic Usage

1. Set up environment variables:

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
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';

export const { GET, POST } = createWalletAuthHandler({
  // Optional custom database path
  dbPath: './custom/path/to/users.db',
  
  // Optional custom validation
  customValidation: async (walletAddress: string) => {
    // Add your custom validation logic
    return true;
  }
});
```

3. Use the authentication component:

```typescript
// app/auth/page.tsx
'use client';

import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';

export default function AuthPage() {
  return (
    <WalletAuth 
      onAuthenticated={(user) => {
        console.log('Authenticated user:', user);
      }}
      config={{
        appName: "Your App",
        appDescription: "Secure authentication with ZeroBrix",
        theme: {
          primary: "blue",
          secondary: "teal"
        }
      }}
    />
  );
}
```

## Database Usage

The library includes a built-in SQLite database for user storage. The database is automatically initialized and managed.

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

### Direct Database Access

You can access the database directly if needed:

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
  email: 'newemail@example.com'
});

// Delete a user
const deleted = await db.deleteUser(walletAddress);
```

### Custom Database Path

You can specify a custom path for the SQLite database:

```typescript
import { SQLiteDatabase } from '@zerocat-software/zerobrix-auth/server';

const db = SQLiteDatabase.getInstance('./custom/path/to/users.db');
```

## Customization

### Styling

The library uses Tailwind CSS for styling. You can customize the appearance using the `customStyles` config:

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

You can handle errors using the `onError` prop:

```typescript
<WalletAuth 
  onError={(error) => {
    console.error('Auth error:', error);
    // Handle error (e.g., show notification)
  }}
/>
```

## Migration

If you need to migrate from a different database to SQLite:

```typescript
import { db } from '@zerocat-software/zerobrix-auth/server';

async function migrateUsers(users: Array<{
  wallet_address: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
}>) {
  await db.initialize();
  
  for (const user of users) {
    await db.createUser(user);
  }
}
```

## Security

The library uses SQLite's built-in security features and prepared statements to prevent SQL injection. All user data is properly sanitized before being stored in the database.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

BSD-3-Clause © ZEROCAT