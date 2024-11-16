import { NextRequest } from 'next/server';
import { WalletAuthHandlerConfig, AuthResponse, NonceResponse } from '../../types';

const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

export const createWalletAuthHandler = (config: WalletAuthHandlerConfig) => {
  const API_URL = getEnvVariable('ZEROBRIX_API_URL');
  const API_KEY = getEnvVariable('ZEROBRIX_API_KEY');
  const CONTRACT_ID = getEnvVariable('AUTH_CONTRACT_ID');

  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  const GET = async (): Promise<Response> => {
    try {
      const response = await fetch(`${API_URL}?action=generateNonce&contractId=${CONTRACT_ID}`, {
        headers: { 'X-API-Key': API_KEY },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return new Response(
        JSON.stringify({ nonce: data.nonce }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error generating nonce:', error);
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate nonce', nonce: '' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };

  const POST = async (req: NextRequest): Promise<Response> => {
    try {
      const { nonce } = await req.json();
      const verifyResponse = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'verifyAuthentication',
          contractId: CONTRACT_ID,
          nonce: nonce,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }

      const verifyData = await verifyResponse.json();
      const { authenticated, userAddress } = verifyData;

      if (!authenticated || !userAddress) {
        return new Response(
          JSON.stringify({ authenticated: false, error: 'Authentication failed' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (config.customValidation) {
        const isValid = await config.customValidation(userAddress);
        if (!isValid) {
          return new Response(
            JSON.stringify({ authenticated: false, error: 'Custom validation failed' }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      return new Response(
        JSON.stringify({ authenticated: true, userAddress }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error verifying authentication:', error);
      
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Authentication verification failed' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };

  return { GET, POST };
};

export default createWalletAuthHandler;