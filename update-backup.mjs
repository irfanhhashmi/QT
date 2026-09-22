/**
 * QuikTalks Complete Recovery Backup Generator
 * Creates an exact, bit-for-bit verified snapshot of the entire application.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('📦 Updating QuikTalks Recovery Backup (Complete State)');
console.log('====================================================');

const backupV100 = path.resolve('backups/v1.0.0-working-state');
const backupV110 = path.resolve('backups/v1.1.0-working-state');
const dbBackupDir = path.resolve('backups/database');
const tarArchive = path.resolve('backups/quiktalks-working-state-latest.tar.gz');

// Ensure directories exist
fs.mkdirSync(backupV100, { recursive: true });
fs.mkdirSync(backupV110, { recursive: true });
fs.mkdirSync(dbBackupDir, { recursive: true });

// 1. Copy database snapshot
if (fs.existsSync('data/analytics_sessions.json')) {
  fs.copyFileSync('data/analytics_sessions.json', path.join(dbBackupDir, 'analytics_sessions.json'));
  console.log('✅ Backed up database to backups/database/analytics_sessions.json');
}

// 2. Define all files and directories to back up
const itemsToCopy = [
  'src',
  'public',
  'data',
  'package.json',
  'metadata.json',
  'server.ts',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'Dockerfile',
  '.dockerignore',
  '.env.example',
  '.gitignore',
  'AGENTS.md',
  'railway.json',
  'nixpacks.toml',
  'sw.js',
  'SNAPSHOT_NOTES.md',
  'restore-backup.mjs',
  'restore-snapshot.mjs',
  'verify-backup.mjs',
  'update-backup.mjs',
  'debug-ws-500.mjs',
  'test-app-url.mjs',
  'test-cookie-ws.mjs',
  'test-live-domain.mjs',
  'bun.lock'
];

// Copy to v1.0.0-working-state
for (const item of itemsToCopy) {
  if (fs.existsSync(item)) {
    const stat = fs.statSync(item);
    if (stat.isDirectory()) {
      execSync(`rm -rf "${path.join(backupV100, item)}" && cp -r "${item}" "${backupV100}/"`);
      execSync(`rm -rf "${path.join(backupV110, item)}" && cp -r "${item}" "${backupV110}/"`);
    } else {
      fs.copyFileSync(item, path.join(backupV100, item));
      fs.copyFileSync(item, path.join(backupV110, item));
    }
  }
}
console.log('✅ All directories and files copied to backups/v1.0.0-working-state and v1.1.0-working-state');

// 3. Create full compressed tar archive
const tarFileList = itemsToCopy.filter(i => fs.existsSync(i)).join(' ');
console.log('📦 Compressing into tar archive...');
execSync(`tar -czf "${tarArchive}" ${tarFileList}`, { stdio: 'inherit' });
const tarStat = fs.statSync(tarArchive);
console.log(`✅ Compressed tarball created: ${(tarStat.size / 1024).toFixed(2)} KB`);

// 4. Run verification
console.log('\n🔍 Running verification script...');
execSync('node verify-backup.mjs', { stdio: 'inherit' });

console.log('\n====================================================');
console.log('🎉 Complete recovery backup successfully updated and verified!');
console.log('====================================================\n');
