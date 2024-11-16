import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'dist/index.js',
  'dist/index.mjs',
  'dist/index.d.ts',
  'dist/react/index.js',
  'dist/react/index.mjs',
  'dist/react/index.d.ts',
  'dist/server/index.js',
  'dist/server/index.mjs',
  'dist/server/index.d.ts'
];

function verifyBuild() {
  console.log('Verifying build output...');
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  );

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  console.log('✅ All required files present');
  
  try {
    const mainDts = fs.readFileSync(
      path.join(process.cwd(), 'dist/index.d.ts'), 
      'utf8'
    );
    if (!mainDts.includes('export {')) {
      throw new Error('Main type declarations appear to be empty');
    }
    console.log('✅ Type declarations verified');
  } catch (error) {
    console.error('❌ Type declaration verification failed:', error);
    process.exit(1);
  }

  console.log('✅ Build verification complete');
}

verifyBuild();