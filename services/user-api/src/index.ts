// index.ts

import { createService } from './service';

(async () => {
    const { start } = await createService();
    await start();
})().catch((error: unknown) => {
    console.error('Error starting the User API service:', error);

    // Safely handle 'error':
    const errorObj =
        error instanceof Error
            ? new Error(`Server failed to start: ${error.message}`)
            : new Error(
                  `Server failed to start with unknown error: ${String(error)}`
              );
    throw errorObj;
});
