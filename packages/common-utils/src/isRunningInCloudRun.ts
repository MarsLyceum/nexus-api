// Check if the process is running in Google Cloud Run
export const isRunningInCloudRun = () => {
    // Google Cloud Run provides these environment variables by default
    const requiredEnvVars = ['K_REVISION', 'K_SERVICE', 'PORT'];

    // Check if all required environment variables are set
    const isInCloudRun = requiredEnvVars.every(
        (envVar) => process.env[envVar] !== undefined
    );

    if (isInCloudRun) {
        console.log('This process is running in Google Cloud Run.');
    } else {
        console.log('This process is NOT running in Google Cloud Run.');
    }

    return isInCloudRun;
};
