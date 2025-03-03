// scripts/generate-migration.js
const { exec } = require('node:child_process');
const path = require('node:path');

const dataSourcePath = path.resolve(
    __dirname,
    '../src/db_connection/createAppDataSource.ts'
);
const migrationName = process.argv[2];

if (!migrationName) {
    console.error('Please provide a migration name');
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
}

exec(
    `ts-node -r ts-node/register ./node_modules/typeorm/cli.js migration:generate --dataSource ${dataSourcePath} ${migrationName}`,
    (error, stdout, stderr) => {
        if (error) {
            console.error(`Error generating migration: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
    }
);
