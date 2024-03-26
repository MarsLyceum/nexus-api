import * as forge from "node-forge";
import * as fs from "fs";
import readlineSync from "readline-sync"; // Import readline-sync

// Function to generate a new RSA private key
function generatePrivateKey(): forge.pki.rsa.PrivateKey {
  return forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 }).privateKey;
}

// Function to save the private key to a file
function savePrivateKey(
  privateKey: forge.pki.rsa.PrivateKey,
  filename: string
): void {
  const pem = forge.pki.privateKeyToPem(privateKey);
  fs.writeFileSync(filename, pem, "utf8");
}

// Function to load the private key from a file
export function loadPrivateKey(filename: string): forge.pki.rsa.PrivateKey {
  const pem = fs.readFileSync(filename, "utf8");
  return forge.pki.privateKeyFromPem(pem);
}

// Function to encrypt the password using the public key
function encryptPassword(
  publicKey: forge.pki.rsa.PublicKey,
  password: string
): string {
  const encrypted = publicKey.encrypt(password, "RSA-OAEP", {
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
  const decrypted = privateKey.decrypt(encryptedPassword, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return decrypted;
}

async function encryptPasswordWithKey(privateKey: forge.pki.rsa.PrivateKey) {
  // Get the public key from the private key
  const publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);

  // Prompt the user for the password, without showing it in the terminal
  const password = readlineSync.question("Enter the password to encrypt: ", {
    hideEchoBack: true, // This hides the password input
  });

  // Encrypt the password
  const encryptedPasswordBase64 = encryptPassword(publicKey, password);
  console.log("Encrypted Password (Base64):", encryptedPasswordBase64);
}

// Modified example usage to use readline-sync for password input
async function main(): Promise<void> {
  try {
    // Load the private key from the file
    const privateKey = loadPrivateKey("private_key.pem");
    encryptPasswordWithKey(privateKey);
  } catch {
    // Generate a new RSA private key
    const privateKey = generatePrivateKey();

    // Save the private key to a file
    savePrivateKey(privateKey, "private_key.pem");

    encryptPasswordWithKey(privateKey);
  }
}

export function decryptDbPassword() {
  const ENCRYPTED_DB_PASSWORD =
    "MFxX8GDVxBjZwkMxH4RgzZbUnbxq47XzVdAhAzE+dobzA7zXjcQ4QErrE+QokR8wKtvlQYV0AqU7mh9cJXpG2L5Toy/gZK97rvTCuSCPw1PHb8GyWdjLnYrBxOuNQ26Pahi4vG82ZD7XZxOr5uEcyfTSMHNTAZAdYL3DgZvVqKj5YJiscKx/cuzDtXualeHQMgPxi8Tv1pgO+eyWG9HE1K3p60HDRM1EBTQdbjyBJnlap9lqapu4nF338x2u/zqkF9ixw1r69EB1bPYnPNZAaZjQ9tFx9D8krPPNoM0s/RFJJvm5085vCQjN6LYN+xDtDV/2qAO0ZDZ0XGcrm3V4/g==";

  const privateKeyFile = loadPrivateKey("private_key.pem");
  const decryptedPassword = decryptPassword(
    privateKeyFile,
    ENCRYPTED_DB_PASSWORD
  );

  return decryptedPassword;
}

// main().catch(console.error);
