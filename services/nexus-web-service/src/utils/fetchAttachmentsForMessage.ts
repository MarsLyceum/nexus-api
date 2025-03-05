import { GroupChannelMessage } from 'group-api-client';

import { SupabaseClientSingleton } from './supabaseClient';

export const fetchAttachmentsForMessage = async (
    message: GroupChannelMessage
) => {
    const { attachmentFilePaths, ...messageWithoutFilePaths } = message;

    if (!attachmentFilePaths) {
        return {
            ...messageWithoutFilePaths,
            attachmentUrls: [],
        };
    }

    const attachmentUrls = await Promise.all(
        attachmentFilePaths.map(async (attachmentFilePath: string) => {
            const { data } = await SupabaseClientSingleton.getInstance()
                .storage.from('message-attachments')
                .createSignedUrl(attachmentFilePath, 60 * 60);

            return data?.signedUrl ?? '';
        })
    );

    // Fallback if no data is returned
    return {
        ...messageWithoutFilePaths,
        attachmentUrls,
    };
};
