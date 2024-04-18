import * as forge from 'node-forge';
import * as fs from 'node:fs';
import path from 'node:path';
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

// Function to decrypt the password using the private key
export function decryptPassword(
    privateKey: forge.pki.rsa.PrivateKey,
    encryptedPasswordBase64: string
): string {
    const encryptedPassword = forge.util.decode64(encryptedPasswordBase64);
    const decrypted = privateKey.decrypt(encryptedPassword, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
    });
    return decrypted;
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

export function decryptDbPassword(cloudDb = true) {
    if (!cloudDb) {
        const ENCRYPTED_DB_PASSWORD =
            'MFxX8GDVxBjZwkMxH4RgzZbUnbxq47XzVdAhAzE+dobzA7zXjcQ4QErrE+QokR8wKtvlQYV0AqU7mh9cJXpG2L5Toy/gZK97rvTCuSCPw1PHb8GyWdjLnYrBxOuNQ26Pahi4vG82ZD7XZxOr5uEcyfTSMHNTAZAdYL3DgZvVqKj5YJiscKx/cuzDtXualeHQMgPxi8Tv1pgO+eyWG9HE1K3p60HDRM1EBTQdbjyBJnlap9lqapu4nF338x2u/zqkF9ixw1r69EB1bPYnPNZAaZjQ9tFx9D8krPPNoM0s/RFJJvm5085vCQjN6LYN+xDtDV/2qAO0ZDZ0XGcrm3V4/g==';

        const privateKeyFile = loadPrivateKey(
            path.join('./keys/db_private_key.pem')
        );
        const decryptedPassword = decryptPassword(
            privateKeyFile,
            ENCRYPTED_DB_PASSWORD
        );

        return decryptedPassword;
    }

    return '';
}
