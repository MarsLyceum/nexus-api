import { PubSub as GCPubSub } from '@google-cloud/pubsub';

import { isRunningInCloudRun } from './utils';

export const GooglePubSubClientSingleton = (function () {
    let pubSubClient: GCPubSub | undefined;

    return {
        getInstance() {
            if (!pubSubClient) {
                pubSubClient = isRunningInCloudRun()
                    ? new GCPubSub({
                          projectId: 'hephaestus-418809',
                      })
                    : new GCPubSub({
                          projectId: 'hephaestus-418809',
                          keyFilename:
                              '../../service-account-keys/hephaestus-418809-aca9086bcf82.json',
                      });
            }
            return pubSubClient;
        },
    };
})();
