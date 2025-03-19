import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// Function to find the .env file starting from the current directory and moving up
const findEnvFile = (startDir: string): string | null => {
    let currentDir = startDir;
    const rootDir = resolve('/');

    while (currentDir !== rootDir) {
        const envPath = resolve(currentDir, '.env');
        if (existsSync(envPath)) {
            return envPath;
        }
        currentDir = dirname(currentDir);
    }

    // Check the root directory itself as the last step
    const rootEnvPath = resolve(rootDir, '.env');
    if (existsSync(rootEnvPath)) {
        return rootEnvPath;
    }

    return null;
};

// Get the current working directory
const currentWorkingDir = process.cwd();
const envPath = findEnvFile(currentWorkingDir);

if (envPath) {
    config({ path: envPath });
} else {
    console.error('.env file not found.');
}

// Now you can access the environment variables
export const { DATABASE_NAME } = process.env;
export const { DATABASE_USERNAME } = process.env;
export const DATABASE_PASSWORD = encodeURIComponent(
    process.env.DATABASE_PASSWORD ?? ''
);
export const { SUPABASE_URL } = process.env;
export const { SUPABASE_SERVICE_KEY } = process.env;
export const { UPSTASH_REDIS_REST_URL } = process.env;
export const { UPSTASH_REDIS_REST_TOKEN } = process.env;
