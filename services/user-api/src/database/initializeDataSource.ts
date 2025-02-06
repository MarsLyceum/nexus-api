import { DATA_SOURCE } from './createAppDataSource';

export async function initializeDataSource() {
    const dataSource = DATA_SOURCE;
    try {
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        return dataSource;
    } catch (error) {
        console.log('error:', error);
    }

    return dataSource;
}
