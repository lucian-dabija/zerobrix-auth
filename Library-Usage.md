# Understanding Library Entry Points

## How to Use the Entry Points

### 1. Full Library Import
```typescript
import { WalletAuth, createWalletAuthHandler } from '@zerocat-software/zerobrix-auth';

// Use components and utilities
const MyComponent = () => <WalletAuth ... />;
export const { GET, POST } = createWalletAuthHandler(...);
```

### 2. React Components Only
```typescript
import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';

// Only imports the React components, keeping bundle size smaller
const MyComponent = () => <WalletAuth ... />;
```

### 3. Server Utilities Only
```typescript
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';

// Only imports the server-side code
export const { GET, POST } = createWalletAuthHandler(...);
```

### 4. Types Only
```typescript
import type { User, WalletAuthConfig } from '@zerocat-software/zerobrix-auth/types';

// Use types in your TypeScript code
const config: WalletAuthConfig = {
  // ...
};
```

## Package.json Configuration

To make this work, you need to configure your `package.json` with the correct exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.mjs",
      "require": "./dist/server/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

## Benefits

1. **Optimized Bundle Size**: Users only import what they need
2. **Clear Organization**: Logical separation of components, server code, and types
3. **Better Tree-Shaking**: Bundlers can remove unused code more effectively
4. **Type Safety**: TypeScript types are always available
5. **Flexibility**: Users can choose how to import based on their needs

## Example Usage in a Project

### Frontend Page
```typescript
// pages/auth.tsx
import { WalletAuth } from '@zerocat-software/zerobrix-auth/react';
import type { User } from '@zerocat-software/zerobrix-auth/types';

export default function AuthPage() {
  const handleAuth = (user: User) => {
    // Handle authentication
  };

  return <WalletAuth onAuthenticated={handleAuth} />;
}
```

### Backend API Route
```typescript
// app/api/auth/route.ts
import { createWalletAuthHandler } from '@zerocat-software/zerobrix-auth/server';
import type { User } from '@zerocat-software/zerobrix-auth/types';

export const { GET, POST } = createWalletAuthHandler({
  validateUser: async (address: string): Promise<User | null> => {
    // Validation logic
    return null;
  }
});
```