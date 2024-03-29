import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { promises as fs } from 'node:fs';
import path from 'node:path';
// import * as util from 'node:util';

// Assuming you have already authenticated your application with Google Cloud
// by setting the GOOGLE_APPLICATION_CREDENTIALS environment variable.

// Function to access a secret from Google Secret Manager
async function accessSecretVersion(
    projectId: string,
    secretId: string,
    versionId: string = 'latest'
): Promise<string> {
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/${secretId}/versions/${versionId}`;
    const [version] = await client.accessSecretVersion({ name });
    const secretString = version.payload?.data?.toString();
    return secretString ?? '';
}

function getFunctionCallPath(): string {
    const err = new Error('stack');
    const stack = err.stack?.toString() || '';
    const stackLines = stack.split('\n');
    // Skip the first line as it's the error message, and the second line usually points to this function itself
    const callerLine = stackLines[2] || '';
    // Process the line to extract relevant path information; the formatting might need adjustment based on the environment
    const pathMatch = callerLine.match(/\((.*):\d+:\d+\)$/);
    return pathMatch ? pathMatch[1] : 'Path not found';
}

// Example usage
async function saveClientSecret(secretId: string) {
    const projectId = '739193270191';
    const clientSecretJson = await accessSecretVersion(projectId, secretId);

    const thisPath = getFunctionCallPath();
    const keysDir = path.join(path.parse(thisPath).dir, 'keys');
    const keyPath = path.join(keysDir, `${secretId}.pem`);

    // Assuming the client secret JSON contains the credentials,
    // save it to a temporary file for the Google authentication process
    await fs.writeFile(keyPath, clientSecretJson);
}

async function downloadPrivateKeyFromGsm() {
    try {
        const dbKeyFileName = 'db_private_key';

        await saveClientSecret(dbKeyFileName);
        console.log(`Client secret ${dbKeyFileName} saved successfully.`);
    } catch (error) {
        console.error('Failed to save db_private_key client secret:', error);
    }

    try {
        const jwtKeyFileName = 'jwt_private_key';

        await saveClientSecret(jwtKeyFileName);
        console.log(`Client secret ${jwtKeyFileName} saved successfully.`);
    } catch (error) {
        console.error('Failed to save jwt_private_key client secret:', error);
    }
}

// eslint-disable-next-line no-void
void downloadPrivateKeyFromGsm();
