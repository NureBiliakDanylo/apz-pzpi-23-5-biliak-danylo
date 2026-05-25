const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const downloadDump = (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return res.status(500).json({ error: 'Database URL not configured' });

    const dumpFile = path.join(__dirname, '../../database_dump.sql');
    const command = `pg_dump "${dbUrl}" > "${dumpFile}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to create database dump', details: stderr });
        }

        res.download(dumpFile, 'weather_database_dump.sql', (err) => {
            if (err) console.error('Download error:', err);
            try { fs.unlinkSync(dumpFile); } catch (e) {}
        });
    });
};

const createBackup = (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

    // Use --clean and --if-exists to make the script drop existing objects before creating them
    const command = `pg_dump --clean --if-exists "${dbUrl}" > "${backupFile}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup error: ${error}`);
            return res.status(500).json({ error: 'Failed to create backup', details: stderr });
        }
        res.status(201).json({ message: 'Backup created successfully', filename: `backup-${timestamp}.sql` });
    });
};

const listBackups = (req, res) => {
    if (!fs.existsSync(BACKUP_DIR)) {
        return res.json([]);
    }
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to list backups' });
        
        const backups = files
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                try {
                    const stats = fs.statSync(path.join(BACKUP_DIR, f));
                    return {
                        filename: f,
                        createdAt: stats.birthtime,
                        size: stats.size
                    };
                } catch (e) { return null; }
            })
            .filter(b => b !== null)
            .sort((a, b) => b.createdAt - a.createdAt);

        res.json(backups);
    });
};

const restoreBackup = (req, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const backupFile = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupFile)) return res.status(404).json({ error: 'Backup file not found' });

    const dbUrl = process.env.DATABASE_URL;
    
    // Create a temporary file without the problematic transaction_timeout
    const tempRestoreFile = path.join(BACKUP_DIR, `temp-restore-${Date.now()}.sql`);
    try {
        let content = fs.readFileSync(backupFile, 'utf8');
        // Remove the transaction_timeout line that breaks PostgreSQL < 17
        content = content.replace(/SET\s+transaction_timeout\s*=\s*0;/g, '-- SET transaction_timeout = 0; (disabled for compatibility)');
        fs.writeFileSync(tempRestoreFile, content);
    } catch (e) {
        console.error('Preprocessing backup failed:', e);
        return res.status(500).json({ error: 'Failed to preprocess backup file' });
    }

    // Most reliable way: Drop public schema and recreate it, then restore
    const dropCommand = `psql "${dbUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    const restoreCommand = `psql "${dbUrl}" -f "${tempRestoreFile}" -v ON_ERROR_STOP=1`;

    exec(`${dropCommand} && ${restoreCommand}`, (error, stdout, stderr) => {
        // Always try to cleanup temp file
        try { fs.unlinkSync(tempRestoreFile); } catch (e) {}

        if (error) {
            console.error(`Restore error: ${error}`);
            return res.status(500).json({ 
                error: 'Failed to restore backup', 
                details: stderr || error.message 
            });
        }
        console.log('Restore stdout:', stdout);
        res.json({ message: 'Database restored successfully' });
    });
};

module.exports = { downloadDump, createBackup, listBackups, restoreBackup };
