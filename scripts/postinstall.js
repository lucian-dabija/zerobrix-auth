const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function setupDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  ensureDirectoryExists(dataDir);
  
  const gitkeepPath = path.join(dataDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }

  const gitignorePath = path.join(dataDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `
# Database files
*.json
*.encrypted.json

# Keep .gitkeep
!.gitkeep
`);
  }

  // Generate encryption key if not exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    const encryptionKey = generateEncryptionKey();
    fs.writeFileSync(envPath, `DB_ENCRYPTION_KEY=${encryptionKey}\n`, { flag: 'a' });
  }
}

function init() {
  try {
    setupDataDirectory();
    console.log('✅ ZeroBrix Auth: Data directory initialized');
    console.log('✅ ZeroBrix Auth: Encryption configured');
  } catch (error) {
    console.error('Error during post-install setup:', error);
    process.exit(1);
  }
}

init();