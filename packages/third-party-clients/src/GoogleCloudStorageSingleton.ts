import { Storage } from '@google-cloud/storage';

import { isRunningInCloudRun } from 'common-utils';

export const GoogleCloudStorageSingleton = (function () {
    let storageClient: Storage | undefined;

    return {
        getInstance() {
            if (!storageClient) {
                storageClient = isRunningInCloudRun()
                    ? new Storage({
                          projectId: 'hephaestus-418809',
                      })
                    : new Storage({
                          projectId: 'hephaestus-418809',
                          keyFilename:
                              '../../service-account-keys/hephaestus-418809-aca9086bcf82.json',
                      });
            }
            return storageClient;
        },
    };
})();
