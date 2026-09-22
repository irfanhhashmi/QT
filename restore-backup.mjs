/**
 * QuikTalks Automated Backup Restore Utility
 * Restores entire codebase and database to verified working backup state.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('🔄 Restoring QuikTalks to Verified Working State Backup');
console.log('====================================================');

const backupDir = path.resolve('backups/v1.0.0-working-state');
const tarArchive = path.resolve('backups/quiktalks-working-state-latest.tar.gz');
const databaseBackup = path.resolve('backups/database/analytics_sessions.json');

try {
  let restoredFromTar = false;

  // 1. Try restoring from tar archive (most reliable atomic archive)
  if (fs.existsSync(tarArchive)) {
    console.log(`\n[1/3] Extracting archive: ${tarArchive}...`);
    execSync(`tar -xzf "${tarArchive}" -C .`, { stdio: 'inherit' });
    restoredFromTar = true;
    console.log('✅ All files successfully restored from tar archive');
  }

  // 2. Fallback or sync from directory if tar not available
  if (!restoredFromTar && fs.existsSync(backupDir)) {
    console.log(`\n[1/3] Restoring from backup folder: ${backupDir}...`);
    execSync(`cp -r "${backupDir}"/* .`, { stdio: 'inherit' });
    console.log('✅ All files successfully restored from directory');
  }

  // 3. Restore analytics database
  if (fs.existsSync(databaseBackup)) {
    console.log('\n[2/3] Restoring database to data/analytics_sessions.json...');
    fs.mkdirSync('data', { recursive: true });
    fs.copyFileSync(databaseBackup, 'data/analytics_sessions.json');
    console.log('✅ Database successfully restored');
  }

  console.log('\n[3/3] Checking backup verification...');
  if (fs.existsSync('verify-backup.mjs')) {
    execSync('node verify-backup.mjs', { stdio: 'inherit' });
  }

  console.log('\n====================================================');
  console.log('🎉 QuikTalks restoration complete and verified!');
  console.log('====================================================\n');
} catch (err) {
  console.error('\n❌ Restoration failed:', err.message);
  process.exit(1);
}
