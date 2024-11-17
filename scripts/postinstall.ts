import fs from 'fs';
import path from 'path';

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function setupDataDirectory(): void {
  // Create data directory in project root if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  ensureDirectoryExists(dataDir);
  
  // Create an empty .gitkeep file to ensure the directory is tracked
  const gitkeepPath = path.join(dataDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }

  // Add .gitignore for SQLite files if it doesn't exist
  const gitignorePath = path.join(dataDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `
# SQLite database files
*.db
*.db-journal
*.db-wal
*.db-shm

# Keep .gitkeep
!.gitkeep
`);
  }
}

function init(): void {
  try {
    setupDataDirectory();
    console.log('✅ ZeroBrix Auth: Data directory initialized');
    console.log('✅ ZeroBrix Auth: SQLite configuration complete');
  } catch (error) {
    console.error('Error during post-install setup:', error);
    process.exit(1);
  }
}

init();