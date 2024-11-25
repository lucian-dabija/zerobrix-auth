const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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

# Keep .gitkeep
!.gitkeep
`);
  }

  const dbPath = path.join(dataDir, 'zerobrix-users.json');
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
  }
}

function init() {
  try {
    setupDataDirectory();
    console.log('✅ ZeroBrix Auth: Data directory initialized');
    console.log('✅ ZeroBrix Auth: JSON database configured');
  } catch (error) {
    console.error('Error during post-install setup:', error);
    process.exit(1);
  }
}

init();