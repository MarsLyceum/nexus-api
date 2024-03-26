import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import * as fs from "fs";
import * as util from "util";

// Assuming you have already authenticated your application with Google Cloud
// by setting the GOOGLE_APPLICATION_CREDENTIALS environment variable.

const writeFile = util.promisify(fs.writeFile);

// Function to access a secret from Google Secret Manager
async function accessSecretVersion(
  projectId: string,
  secretId: string,
  versionId: string = "latest"
): Promise<string> {
  const client = new SecretManagerServiceClient();
  const name = `projects/${projectId}/secrets/${secretId}/versions/${versionId}`;
  const [version] = await client.accessSecretVersion({ name });
  const secretString = version.payload?.data?.toString();
  return secretString ?? "";
}

// Example usage
async function saveClientSecret() {
  const projectId = "164075363000";
  const secretId = "PostgreSQL-private-key";
  const clientSecretJson = await accessSecretVersion(projectId, secretId);

  // Assuming the client secret JSON contains the credentials,
  // save it to a temporary file for the Google authentication process
  const tempFilePath = "private_key.pem";
  await writeFile(tempFilePath, clientSecretJson);
}

saveClientSecret()
  .then(() => console.log("Client secret saved successfully."))
  .catch((error) => console.error("Failed to save client secret:", error));
