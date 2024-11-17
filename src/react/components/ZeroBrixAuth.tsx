'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Loader2, QrCode, Smartphone, ArrowRight,
  RefreshCw, Download
} from 'lucide-react';
import type { ZeroBrixAuthProps } from '../../types';

import {
  Card,
  Button,
  Dialog,
  DialogContent,
} from './ui';

interface ExtendedZeroBrixAuthProps extends ZeroBrixAuthProps {
  stopPolling?: boolean;
}

export function ZeroBrixAuth({ onAuthenticated, config, onError, stopPolling = false }: ExtendedZeroBrixAuthProps) {
  const [stage, setStage] = useState<'intro' | 'qr' | 'polling'>('intro');
  const [qrData, setQrData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isPollingActive, setIsPollingActive] = useState(true);

  const cleanupTimers = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  // Effect to handle polling state changes
  useEffect(() => {
    if (stopPolling) {
      setIsPollingActive(false);
      cleanupTimers();
    } else {
      setIsPollingActive(true);
    }
  }, [stopPolling]);

  useEffect(() => {
    if (stage === 'polling' && nonce && isPollingActive && !stopPolling) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/wallet-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonce }),
          });
          
          if (!response.ok) throw new Error('Verification failed');

          const data = await response.json();
          if (data.authenticated && data.userAddress) {
            cleanupTimers();
            onAuthenticated(data.userAddress, data.user);
            
            // Handle page refresh if configured
            if (config.refreshPageOnAuth) {
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, config.timeouts?.polling || 3000);

      setPollingInterval(interval);

      const timeout = setTimeout(() => {
        cleanupTimers();
        setError('Authentication timeout. Please try again.');
        setStage('intro');
      }, config.timeouts?.authentication || 300000);

      setTimeoutId(timeout);

      return () => cleanupTimers();
    }
  }, [stage, nonce, onAuthenticated, isPollingActive, stopPolling, config]);

  const generateQR = async () => {
    try {
      setError(null);
      const response = await fetch('/api/wallet-auth');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate authentication code');
      }

      const receiverAddr = process.env.NEXT_PUBLIC_SERVER_WALLET_ADDRESS || '';
      const txDetails = `smart_contract_auth_${process.env.NEXT_PUBLIC_AUTH_CONTRACT_ID},nonce_${data.nonce}`;
      
      const qrData = `amount=0,recipientAddress=${receiverAddr},senderAddress=customer_,timestamp=${new Date().toISOString()},tokenId=${process.env.NEXT_PUBLIC_ZEROCOIN_TOKEN_ID},transactionCost=0,transactionDetails=${txDetails},transactionId=transaction_`;

      setQrData(qrData);
      setNonce(data.nonce);
      setStage('qr');
    } catch (error) {
      console.error('QR generation error:', error);
      setError('Failed to generate authentication code. Please try again.');
    }
  };

  const handleRetry = () => {
    cleanupTimers();
    setError(null);
    setQrData(null);
    setNonce(null);
    setStage('intro');
    setIsPollingActive(true);
  };

  const {
    theme = { primary: 'blue', secondary: 'teal' },
    customStyles = {}
  } = config;

  return (
    <div className={`min-h-screen flex items-center justify-center ${customStyles.container || ''}`}>
      {/* ZeroCat Logo */}
      <div className="fixed bottom-4 right-4 w-32 h-14 opacity-70 hover:opacity-100 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: `#${theme.primary}`, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: `#${theme.secondary}`, stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path d="M20 15 h100 v30 h-100 Z" fill="none" stroke="url(#logoGradient)" strokeWidth="2"/>
          <text x="70" y="35" textAnchor="middle" fill="url(#logoGradient)" fontFamily="Arial" fontWeight="bold" fontSize="14">
            ZEROCAT
          </text>
        </svg>
      </div>

      <Card className={`w-full max-w-md p-6 ${customStyles.card || ''}`}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  {config.appName}
                </h1>
                <p className="text-muted-foreground">
                  {config.appDescription}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Smartphone className="h-6 w-6 text-blue-500 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-medium">Get ZeroWallet Ready</h3>
                    <p className="text-sm text-muted-foreground">
                      Download ZeroWallet from{' '}
                      <a
                        href="https://brix.zerocat.one/zerowallet-beta.apk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        brix.zerocat.one
                        <Download className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <QrCode className="h-6 w-6 text-teal-500 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-medium">Smart Transaction Auth</h3>
                    <p className="text-sm text-muted-foreground">
                      Use ZeroWallet to scan a QR code for secure authentication.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className={`w-full ${customStyles.button || ''}`}
                onClick={generateQR} 
              >
                Start Authentication
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {stage === 'qr' && qrData && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Scan QR Code</h2>
                <p className="text-sm text-muted-foreground">
                  Open ZeroWallet and scan this code to authenticate.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={qrData}
                    size={256}
                    level="M"
                    imageSettings={{
                      src: config.logo?.src || "/icon-192x192.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  After scanning, approve the authentication transaction in your wallet and return here to continue.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setStage('polling')}
                  className={`w-full ${customStyles.button || ''}`}
                >
                  I've Approved the Transaction
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {stage === 'polling' && (
            <motion.div
              key="polling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold">Verifying Authentication</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Please wait while we confirm your transaction...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 rounded-lg"
          >
            <p className="text-sm text-red-500 text-center">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
}