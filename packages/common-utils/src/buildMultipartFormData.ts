import FormData from 'form-data';

/**
 * Builds a FormData object from the provided generic payload and file(s).
 *
 * @param payload - The generic payload data to be sent.
 * @param files - Either a Promise<File> or an array of Promise<File>.
 * @returns A promise that resolves with the populated FormData.
 */
export async function buildMultipartFormData<T extends Record<string, unknown>>(
    payload: T,
    files?: Promise<File> | Promise<File>[],
    filesKey?: string
): Promise<FormData> {
    const formData = new FormData();

    // Append all payload fields to the form data.
    Object.entries(payload).forEach(([key, value]) => {
        if (key !== filesKey) {
            formData.append(key, String(value));
        }
    });

    if (files) {
        // Resolve files: either a single Promise or an array of Promises.
        const resolvedFiles: File[] = Array.isArray(files)
            ? await Promise.all(files)
            : [await files];

        // Append each file to the FormData under the key filesKey
        resolvedFiles.forEach((file) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (file as any).createReadStream === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stream = (file as any).createReadStream();
                formData.append(filesKey ?? 'attachments', stream, {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    filename: (file as any).filename || `${Date.now()}.jpg`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    contentType: (file as any).mimetype || 'image/jpeg',
                });
            } else {
                formData.append(filesKey ?? 'attachments', file);
            }
        });
    }

    return formData;
}
