import * as forge from 'node-forge';
import { promises as fs } from 'node:fs';

// Function to generate a new RSA private key
function generatePrivateKey(): forge.pki.rsa.PrivateKey {
    return forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 }).privateKey;
}

// Function to save the private key to a file
async function savePrivateKey(
    privateKey: forge.pki.rsa.PrivateKey,
    filename: string
): Promise<void> {
    const pem = forge.pki.privateKeyToPem(privateKey);
    await fs.writeFile(filename, pem, 'utf8');
}

async function main() {
    const fileName = process.argv[2];

    await savePrivateKey(generatePrivateKey(), fileName);
}

// eslint-disable-next-line no-void
void main();
