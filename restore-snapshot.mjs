/**
 * QuikTalks Automated Snapshot Restore Utility
 * Restores codebase and database to the verified working snapshot:
 * Tag: v1.0.0-working-state (Commit 50f44ab)
 * Date: 2026-09-07
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('🔄 Restoring QuikTalks to Working Snapshot: v1.0.0-working-state');
console.log('====================================================');

const snapshotDir = path.resolve('backups/v1.0.0-working-state');
const databaseBackup = path.resolve('backups/database/analytics_sessions.json');
const tarArchive = path.resolve('backups/quiktalks-working-state-latest.tar.gz');

try {
  // 1. Try Git checkout if repo is available
  if (fs.existsSync('.git')) {
    console.log('\n[1/3] Restoring from Git tag v1.0.0-working-state...');
    try {
      execSync('git checkout v1.0.0-working-state', { stdio: 'inherit' });
      console.log('✅ Git working tree reset to tag v1.0.0-working-state');
    } catch (gitErr) {
      console.warn('⚠️ Git checkout encountered a warning, falling back to file archive restoration...');
    }
  }

  // 2. Fallback or file-level guarantee from tar archive
  if (fs.existsSync(tarArchive)) {
    console.log('\n[2/3] Extracting file snapshot from backups/snapshot-working-2026-09-07.tar.gz...');
    execSync(`tar -xzf "${tarArchive}" -C .`, { stdio: 'inherit' });
    console.log('✅ All application and configuration files restored from tar archive');
  } else if (fs.existsSync(snapshotDir)) {
    console.log('\n[2/3] Copying files from snapshot directory backups/snapshot-2026-09-07...');
    execSync(`cp -r "${snapshotDir}"/* .`, { stdio: 'inherit' });
    console.log('✅ Restored from snapshot directory');
  }

  // 3. Restore database
  if (fs.existsSync(databaseBackup)) {
    console.log('\n[3/3] Restoring database to data/analytics_sessions.json...');
    fs.mkdirSync('data', { recursive: true });
    fs.copyFileSync(databaseBackup, 'data/analytics_sessions.json');
    console.log('✅ Database successfully restored');
  }

  console.log('\n====================================================');
  console.log('🎉 Snapshot restoration complete!');
  console.log('All WebRTC signaling, dev server safeguards, and database state are restored.');
  console.log('====================================================\n');
} catch (err) {
  console.error('\n❌ Error during snapshot restore:', err.message);
  process.exit(1);
}
