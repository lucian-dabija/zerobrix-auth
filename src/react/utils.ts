import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function createGradient(from: string, to: string): string {
  return `bg-gradient-to-r from-${from}-600 to-${to}-600`;
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function createThemeColors(primary: string, secondary: string) {
  return {
    primary: {
      light: `${primary}-50`,
      main: `${primary}-600`,
      dark: `${primary}-950`,
    },
    secondary: {
      light: `${secondary}-50`,
      main: `${secondary}-600`,
      dark: `${secondary}-950`,
    }
  };
}