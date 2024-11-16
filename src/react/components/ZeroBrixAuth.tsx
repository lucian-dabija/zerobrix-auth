'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Loader2, QrCode, Smartphone, ArrowRight,
  RefreshCw, Download
} from 'lucide-react';
import type { ZeroBrixAuthProps } from '../../types';

// Internal components - these would be bundled with the library
import {
  Card,
  Button,
  Dialog,
  DialogContent,
} from './ui'; // We'll include minimal UI components

export function ZeroBrixAuth({ onAuthenticated, config }: ZeroBrixAuthProps) {
  const [stage, setStage] = useState<'intro' | 'qr' | 'polling'>('intro');
  const [qrData, setQrData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const cleanupTimers = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (timeoutId) clearTimeout(timeoutId);
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  useEffect(() => {
    if (stage === 'polling' && nonce) {
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
            onAuthenticated(data.userAddress);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 3000);

      setPollingInterval(interval);

      // Set 5-minute timeout
      const timeout = setTimeout(() => {
        cleanupTimers();
        setError('Authentication timeout. Please try again.');
        setStage('intro');
      }, 300000);

      setTimeoutId(timeout);

      return () => cleanupTimers();
    }
  }, [stage, nonce, onAuthenticated]);

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
  };

  const {
    theme = { primary: 'blue', secondary: 'teal' },
    customStyles = {}
  } = config;

  const getGradientStyle = () => {
    return {
      backgroundImage: `
        radial-gradient(circle at top left, ${theme.primary}10, transparent),
        radial-gradient(circle at bottom right, ${theme.secondary}10, transparent)
      `
    };
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${customStyles.container || ''}`}>
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