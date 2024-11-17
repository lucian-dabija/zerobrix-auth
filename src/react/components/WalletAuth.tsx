'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { WalletAuthProps, User, UserDetails } from '../../types';
import { ZeroBrixAuth } from './ZeroBrixAuth';

import {
  Card,
  Input,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui';

export function WalletAuth({ onAuthenticated, config, onError }: WalletAuthProps) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'User'
  });
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleUserDetailsChange = <K extends keyof UserDetails>(
    key: K,
    value: UserDetails[K]
  ) => {
    setUserDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAuthenticationSuccess = async (user: User, address: string) => {
    try {
      localStorage.setItem('wallet_address', address);
      onAuthenticated(user);
    } catch (error) {
      console.error('Error saving authentication:', error);
      setError('Failed to save authentication state');
      if (onError) {
        onError(error instanceof Error ? error : new Error('Authentication failed'));
      }
    }
  };

  const handleZeroBrixAuth = async (address: string) => {
    setLoading(true);
    setWalletAddress(address);
    setError(null);
    
    try {
      const response = await fetch('/api/users/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address })
      });

      const data = await response.json();
      
      if (response.ok) {
        const formattedUser: User = {
          wallet_address: data.user.wallet_id,
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          role: data.user.role || 'User',
          created_at: data.user.created_at
        };
        handleAuthenticationSuccess(formattedUser, address);
        return;
      } else if (response.status === 404) {
        setIsNewUser(true);
        setLoading(false);
        return;
      }

      throw new Error(data.error || 'Authentication failed');
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to the server');
      if (onError) {
        onError(error instanceof Error ? error : new Error('Authentication failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const createResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: walletAddress,
          first_name: userDetails.first_name,
          last_name: userDetails.last_name,
          email: userDetails.email,
          role: userDetails.role
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create user profile');
      }

      const data = await createResponse.json();
      
      const user: User = {
        wallet_address: data.user.wallet_id,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        email: data.user.email,
        role: data.user.role,
        created_at: data.user.created_at
      };

      handleAuthenticationSuccess(user, walletAddress);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account');
      if (onError) {
        onError(error instanceof Error ? error : new Error('Registration failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isNewUser) {
    return <ZeroBrixAuth onAuthenticated={handleZeroBrixAuth} config={config} onError={onError} />;
  }

  const {
    theme = { primary: 'blue', secondary: 'teal' },
    customStyles = {}
  } = config;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-${theme.primary}-50 via-${theme.secondary}-50 to-rose-50 dark:from-${theme.primary}-950 dark:via-${theme.secondary}-950 dark:to-rose-950 p-4 ${customStyles.container || ''}`}>
      <Card className={`w-full max-w-md p-6 ${customStyles.card || ''}`}>
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-${theme.primary}-600 to-${theme.secondary}-600 bg-clip-text text-transparent`}>
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Please provide some additional details
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 rounded-lg"
          >
            <p className="text-sm text-red-500 text-center">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={userDetails.first_name}
              onChange={(e) => handleUserDetailsChange('first_name', e.target.value)}
              required
              disabled={loading}
              className={customStyles.input}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={userDetails.last_name}
              onChange={(e) => handleUserDetailsChange('last_name', e.target.value)}
              required
              disabled={loading}
              className={customStyles.input}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={userDetails.email}
              onChange={(e) => handleUserDetailsChange('email', e.target.value)}
              disabled={loading}
              className={customStyles.input}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={userDetails.role}
              onValueChange={(value) => handleUserDetailsChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger className={customStyles.select}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className={`w-full ${customStyles.button || ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => {
            setIsNewUser(false);
            setError(null);
          }}
          disabled={loading}
        >
          ← Back to Authentication
        </Button>
      </Card>
    </div>
  );
}