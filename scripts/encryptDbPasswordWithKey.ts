import * as forge from 'node-forge';
import * as fs from 'node:fs';
import readlineSync from 'readline-sync'; // Import readline-sync

// Function to load the private key from a file
export function loadPrivateKey(filename: string): forge.pki.rsa.PrivateKey {
    const pem = fs.readFileSync(filename, 'utf8');
    return forge.pki.privateKeyFromPem(pem);
}

// Function to encrypt the password using the public key
function encryptPassword(
    publicKey: forge.pki.rsa.PublicKey,
    password: string
): string {
    const encrypted = publicKey.encrypt(password, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
    });
    const encryptedBase64 = forge.util.encode64(encrypted);
    console.log(`Encrypted (Base64): ${encryptedBase64}`);
    return encryptedBase64;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function encryptPasswordWithKey(privateKey: forge.pki.rsa.PrivateKey) {
    // Get the public key from the private key
    const publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);

    // Prompt the user for the password, without showing it in the terminal
    const password = readlineSync.question('Enter the password to encrypt: ', {
        hideEchoBack: true, // This hides the password input
    });

    // Encrypt the password
    const encryptedPasswordBase64 = encryptPassword(publicKey, password);
    console.log('Encrypted Password (Base64):', encryptedPasswordBase64);
}

encryptPasswordWithKey(loadPrivateKey('../keys/db_private_key.pem'));
