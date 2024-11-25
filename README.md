# @zerocat-software/zerobrix-auth

![ZEROCAT Banner](./banner.png)

A modern, secure, and easy-to-use authentication library for Next.js applications powered by ZeroBrix blockchain. Perfect for projects that need blockchain-based authentication with a beautiful frosted-glass modal UI and encrypted user management.

[![npm version](https://img.shields.io/npm/v/@zerocat-software/zerobrix-auth.svg)](https://www.npmjs.com/package/@zerocat-software/zerobrix-auth)
[![License](https://img.shields.io/badge/license-BSD--3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Why ZeroBrix Auth?

ZeroBrix Auth brings enterprise-grade blockchain authentication to your Next.js application with minimal setup. While ZeroBrix Blockchain is our proprietary solution for secure transactions, this authentication library is fully open-source, allowing developers to:

- ✅ Inspect and verify the security implementation
- ✅ Contribute improvements and features
- ✅ Trust through code transparency
- ✅ Customize the solution for specific needs

## Features At a Glance

- 🎨 **Beautiful Modal UI**: Frosted glass design with smooth animations
- 🔐 **Secure Authentication**: QR code-based blockchain authentication
- 🔒 **Encrypted Storage**: Built-in encrypted JSON database
- 📱 **Mobile Ready**: Seamless ZeroWallet mobile app integration
- 🔄 **Flexible Onboarding**: Individual and company account support
- ⚡ **Zero Config**: No manual route setup needed
- 🎯 **Simple Integration**: Just wrap your components
- 🌐 **TypeScript Ready**: Full type support

## Installation

```bash
# Using npm
npm install @zerocat-software/zerobrix-auth

# Using yarn
yarn add @zerocat-software/zerobrix-auth

# Using pnpm
pnpm add @zerocat-software/zerobrix-auth
```

## Complete Setup Guide

### 1. Environment Variables

Create or update `.env.local` in your project root:

```env
# Required: ZeroBrix API Configuration
ZEROBRIX_API_URL=https://brix.zerocat.one/api/v2
ZEROBRIX_API_KEY=your_api_key
AUTH_CONTRACT_ID=your_contract_id

# Required: Public Variables
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address
NEXT_PUBLIC_ZEROCOIN_TOKEN_ID=your_token_id

# Optional: Database Encryption
DB_ENCRYPTION_KEY=your_random_32_byte_hex_string
```

### 2. Create Auth API Route

Create `app/api/auth/route.ts`:

```typescript
import { createAuthApiHandler } from '@zerocat-software/zerobrix-auth';

// Important for Next.js dynamic routes
export const dynamic = 'force-dynamic';

// Export the authentication handlers
export const { GET, POST } = createAuthApiHandler({
  // Optional: Add custom validation
  customValidation: async (walletAddress: string) => {
    return true; // Allow all wallets by default
  }
});
```

### 3. Add the Provider

In your `app/layout.tsx`:

```typescript
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
            // Required
            appName: "Your App Name",
            appDescription: "Login securely with ZeroWallet",
            
            // Optional: Theme
            theme: {
              primary: "blue",
              secondary: "teal"
            }
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Protect Your Pages

Simply wrap any page that needs authentication:

```typescript
'use client';

import { withAuth, useAuth } from '@zerocat-software/zerobrix-auth';

function ProtectedPage() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome back!</p>
      
      {/* User will be either individual or company */}
      <div>
        {user?.company_name ? (
          <p>Company: {user.company_name}</p>
        ) : (
          <p>Name: {user.first_name} {user.last_name}</p>
        )}
      </div>
      
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default withAuth(ProtectedPage);
```

## Understanding the Authentication Flow

### How It Works

1. User visits a protected page
2. Auth modal automatically appears
3. User scans QR code with ZeroWallet
4. ZeroWallet processes the authentication transaction
5. Library verifies the transaction
6. If new user, shows onboarding form
7. User is authenticated and can access protected content

### The Modal UI

The authentication modal includes:
- Clean, modern frosted glass design
- ZEROCAT branding (subtle corner logo)
- Step-by-step guidance
- Smooth transitions
- QR code display
- Loading states
- Error handling

### User Data Storage

All user data is stored in an encrypted JSON file:
- Automatic encryption/decryption
- Secure at rest
- No database setup needed
- Handles both user types:
  - Individual (first name, last name)
  - Company (company name)

## Customization Options

### Styling

```typescript
<AuthProvider
  config={{
    // Theme colors
    theme: {
      primary: "indigo",    // Any Tailwind color
      secondary: "purple"   // Any Tailwind color
    },
    
    // Custom class names
    customStyles: {
      card: "backdrop-blur-xl bg-white/10",
      button: "hover:scale-105",
      input: "focus:ring-2"
    }
  }}
>
```

### Onboarding Configuration

```typescript
<AuthProvider
  config={{
    onboardingFields: {
      // Enable/disable company accounts
      allowCompany: true,
      
      // Field requirements
      requireName: false,
      requireEmail: false,
      
      // Available roles
      availableRoles: ["User", "Admin"]
    }
  }}
>
```

### Custom Validation

```typescript
export const { GET, POST } = createAuthApiHandler({
  customValidation: async (walletAddress: string) => {
    // Example: Check whitelist
    const whitelist = ['0x123...'];
    return whitelist.includes(walletAddress);
    
    // Or check domain
    const email = await getEmailForWallet(walletAddress);
    return email.endsWith('@yourcompany.com');
  }
});
```

## Troubleshooting Guide

### Modal Not Appearing
```typescript
// Make sure to:
// 1. Add 'use client' directive
'use client';

// 2. Wrap the component
export default withAuth(YourComponent);

// 3. Use inside AuthProvider
function App() {
  return (
    <AuthProvider config={...}>
      <YourComponent />
    </AuthProvider>
  );
}
```

### Styling Issues
```javascript
// In tailwind.config.js
module.exports = {
  content: [
    // Essential: Include the library's components
    "./node_modules/@zerocat-software/zerobrix-auth/**/*.{js,ts,jsx,tsx}"
  ]
}
```

### Database Issues
```bash
# Create data directory
mkdir data
chmod 755 data

# Check .env.local
DB_ENCRYPTION_KEY should be exactly 32 bytes when converted to hex
```

## Security Best Practices

1. Always keep your API keys secure
2. Don't expose your DB_ENCRYPTION_KEY
3. Use custom validation for additional security
4. Implement role-based access control
5. Regularly update the library

## Support

- 📧 [Email Support](mailto:software@zerocat.art)
- 🌐 [Website](https://www.zerocat.art)
- 💼 [LinkedIn](https://linkedin.com/company/zerocat)
- 📝 [Blog](https://www.zerocat.art/journal)

## License

Licensed under the BSD-3-Clause License. See [LICENSE](./LICENSE) for more information.

---

<div align="center">
Made with ❤️ by ZEROCAT

[zerocat.art](https://www.zerocat.art) • [LinkedIn](https://www.linkedin.com/company/zerocat) • [Blog](https://www.zerocat.one/journal)
</div>