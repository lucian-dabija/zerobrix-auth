import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react/index.ts',
    'src/server/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    '@radix-ui/react-dialog',
    '@radix-ui/react-label',
    '@radix-ui/react-select',
    'lucide-react',
    'framer-motion',
    'qrcode.react',
    'tailwindcss',
    'better-sqlite3'
  ],
  sourcemap: true,
});