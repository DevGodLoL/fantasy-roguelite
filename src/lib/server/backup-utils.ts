import fs from 'fs';
import path from 'path';

/**
 * Creates an automatic rolling checkpoint of the database.
 * This should be called before any major destructive simulation or reset.
 * 
 * @param actionName - A short name for the action causing the backup (e.g., 'simulate', 'reset')
 */
export async function createAutoCheckpoint(actionName: string = 'checkpoint') {
    try {
        const rootDir = process.cwd();
        const dbPath = path.join(rootDir, 'prisma', 'dev.db');
        const backupDir = path.join(rootDir, 'backups', 'auto_rollbacks');

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Check if DB exists
        if (!fs.existsSync(dbPath)) {
            console.warn(`[AutoCheckpoint] Database not found at ${dbPath}. Skipping backup.`);
            return false;
        }

        // Generate timestamped filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `${actionName}_${timestamp}.db`;
        const destPath = path.join(backupDir, backupFileName);

        // Copy file
        fs.copyFileSync(dbPath, destPath);

        // Keep only the last 10 auto-backups to save space
        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.db'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 10) {
            files.slice(10).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f.name));
            });
        }

        console.log(`[AutoCheckpoint] Created safety backup: ${backupFileName}`);
        return true;
    } catch (error) {
        console.error('[AutoCheckpoint] Failed to create backup:', error);
        return false;
    }
}
