import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZeroBrixAuth } from './ZeroBrixAuth';
import type { User, WalletAuthConfig } from '../../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  showAuthModal: () => void;
  hideAuthModal: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  config?: Partial<WalletAuthConfig>;
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: Error) => void;
}

export function AuthProvider({
  children,
  config = {},
  onAuthSuccess,
  onAuthError,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultConfig: WalletAuthConfig = {
    appName: "Secure Authentication",
    appDescription: "Login securely with ZeroWallet",
    theme: {
      primary: "blue",
      secondary: "teal"
    },
    refreshPageOnAuth: false,
    timeouts: {
      authentication: 300000,
      polling: 3000
    },
    ...config
  };

  useEffect(() => {
    const checkAuth = async () => {
      const walletAddress = localStorage.getItem('wallet_address');
      if (walletAddress) {
        try {
          const response = await fetch('/api/users/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress })
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('wallet_address');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
    };

    checkAuth();
  }, []);

  const handleAuthenticated = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('wallet_address', authenticatedUser.wallet_address);
    setIsModalOpen(false);
    
    if (onAuthSuccess) {
      onAuthSuccess(authenticatedUser);
    }
  };

  const handleError = (error: Error) => {
    console.error('Authentication error:', error);
    if (onAuthError) {
      onAuthError(error);
    }
  };

  const showAuthModal = () => setIsModalOpen(true);
  const hideAuthModal = () => setIsModalOpen(false);
  
  const logout = () => {
    localStorage.removeItem('wallet_address');
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    showAuthModal,
    hideAuthModal,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md m-4"
            >
              <button
                onClick={hideAuthModal}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              >
                ×
              </button>
              <ZeroBrixAuth
                onAuthenticated={(address, user) => {
                  if (user) {
                    handleAuthenticated(user);
                  }
                }}
                config={defaultConfig}
                onError={handleError}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, showAuthModal } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        showAuthModal();
      }
    }, [isAuthenticated]);

    return <WrappedComponent {...props} />;
  };
}